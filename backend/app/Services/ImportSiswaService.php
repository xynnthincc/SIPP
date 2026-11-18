<?php

namespace App\Services;

use App\Models\KelasRombel;
use App\Models\Siswa;
use App\Models\SiswaKelas;
use App\Models\TahunAjaran;
use Illuminate\Support\Carbon;
use PhpOffice\PhpSpreadsheet\IOFactory;
use PhpOffice\PhpSpreadsheet\Shared\Date as ExcelDate;

/**
 * Import data siswa dari ekspor e-rapor "Daftar Peserta Didik per Kelas" (.xlsx).
 *
 * Logika inti dipakai bersama oleh:
 *   - Artisan command  `siswa:import`  (app/Console/Commands/ImportSiswa.php)
 *   - Endpoint API     `POST /siswa/import` (SiswaImportController)
 *
 * Sumber: sheet "Semua Siswa" (header 2 tingkat di baris 5-6, data mulai baris 7).
 * Strategi UPSERT (id siswa lama tetap → data nilai tetap nyambung):
 *   1. Baris ber-NIPD & NIPD ada di DB → update baris tersebut.
 *   2. Baris lain dicocokkan ke siswa DB yang belum ke-match berdasarkan nama
 *      (case-insensitive) + jenis kelamin (mis. NIPD berubah di e-rapor).
 *   3. Sisanya → insert baru: NIS = NIPD bila ada, atau NISN bila tanpa NIPD.
 * Siswa DB yang tidak ada di file sama sekali tidak disentuh.
 */
class ImportSiswaService
{
    /** Kolom sumber → kolom tujuan (nilai string sederhana) */
    private const MAP_STRING = [
        'C' => 'nis',            // NIPD (primary key NIS)
        'B' => 'nama',
        'D' => 'jenis_kelamin',  // L / P
        'F' => 'tempat_lahir',
        'I' => 'agama',
        'J' => 'alamat',
        'T' => 'no_telp',        // HP siswa
        'BE' => 'sekolah_asal',
        'BF' => 'anak_ke',
        'Y' => 'nama_ayah',
        'AB' => 'profesi_ayah',
        'AE' => 'nama_ibu',
        'AH' => 'profesi_ibu',
        'AK' => 'nama_wali',
        'AN' => 'pekerjaan_wali',
    ];

    /**
     * Baca file .xlsx dan susun rencana aksi (tanpa menulis ke database).
     *
     * @return array{
     *   ok: bool, error?: string,
     *   ringkasan?: array<string, mixed>,
     *   insert?: array, updateByNis?: array, updateById?: array,
     *   peringatan?: string[]
     * }
     */
    public function rencana(string $file): array
    {
        if (! is_file($file)) {
            return ['ok' => false, 'error' => 'File tidak ditemukan.'];
        }

        $ta = TahunAjaran::where('is_aktif', true)->first();
        if (! $ta) {
            return ['ok' => false, 'error' => 'Tidak ada tahun ajaran aktif. Aktifkan dulu di menu Tahun Ajaran.'];
        }

        try {
            $spreadsheet = IOFactory::load($file);
        } catch (\Throwable $e) {
            return ['ok' => false, 'error' => 'File tidak bisa dibaca sebagai Excel (.xlsx). '.$e->getMessage()];
        }

        $sheet = $spreadsheet->getSheetByName('Semua Siswa');
        if ($sheet === null) {
            return [
                'ok' => false,
                'error' => "Sheet 'Semua Siswa' tidak ditemukan. Sheet tersedia: ".implode(', ', $spreadsheet->getSheetNames()),
            ];
        }

        $kelasByNama = KelasRombel::where('tahun_ajaran_id', $ta->id)
            ->get()
            ->mapWithKeys(fn (KelasRombel $k) => [$k->nama => $k->id]);

        // ── Tahap 1: baca baris mentah ──
        $rows = [];
        $peringatan = [];
        $duplikatFile = [];
        $rombelTakDikenal = [];
        $tanpaRombel = 0;

        for ($r = 7; $r <= $sheet->getHighestRow(); $r++) {
            $nama = $this->ambilString($sheet, 'B'.$r);
            if ($nama === '') {
                continue;
            }

            $nisKey = $this->keyNis($sheet, 'C'.$r); // NIPD kalau ada
            $nisn = $this->keyNis($sheet, 'E'.$r);
            $key = $nisKey !== '' ? $nisKey : 'row'.$r;

            if ($nisKey !== '' && isset($rows[$nisKey])) {
                $duplikatFile[] = "baris {$r}: NIPD {$nisKey} ({$nama}) duplikat — dilewati";

                continue;
            }

            $rombel = $this->ambilString($sheet, 'AQ'.$r); // "8-B" dsb.
            $kelasNama = strtoupper(preg_replace('/[^A-Z0-9]/i', '', $rombel)); // "8-B" → "8B"
            if ($kelasNama === '') {
                $tanpaRombel++;
                $kelasId = null;
            } elseif ($kelasByNama->has($kelasNama)) {
                $kelasId = $kelasByNama->get($kelasNama);
            } else {
                $rombelTakDikenal[$kelasNama] = ($rombelTakDikenal[$kelasNama] ?? 0) + 1;
                $kelasId = null;
            }

            $data = [];
            foreach (self::MAP_STRING as $kolom => $field) {
                $nilai = $this->ambilString($sheet, $kolom.$r);
                if ($field === 'jenis_kelamin') {
                    $nilai = strtoupper(substr($nilai, 0, 1));
                }
                $data[$field] = $nilai !== '' ? $nilai : null;
            }
            if (! in_array($data['jenis_kelamin'], ['L', 'P'], true)) {
                $peringatan[] = "baris {$r}: JK tidak valid ({$data['jenis_kelamin']}) — dilewati";

                continue;
            }

            $data['tanggal_lahir'] = $this->ambilTanggal($sheet, 'G'.$r);
            $data['kelas_rombel_id'] = $kelasId;
            $data['is_aktif'] = true;
            $data['_nisn'] = $nisn;

            $rows[$key] = $data;
        }

        // ── Tahap 2: putuskan aksi per baris ──
        $dbByNis = Siswa::get()->keyBy('nis');

        $insert = [];
        $updateByNis = [];   // nis DB → data baru
        $updateById = [];    // id DB (match by nama) → data baru
        $matchNama = [];     // jejak review: NIS lama → [nama, nis baru]
        $skip = [];

        $dbBelumMatch = Siswa::get()->keyBy('id'); // kandidat match-by-nama (siswa tanpa match NIPD)
        $nisTerpakai = $dbByNis->keys();           // guard: NIS tidak boleh dipakai siswa lain

        foreach ($rows as $key => $data) {
            $nipd = str_starts_with($key, 'row') ? null : $key;

            if ($nipd !== null && $dbByNis->has($nipd)) {
                // Lapis 1: NIPD sudah ada di DB → update
                $updateByNis[$nipd] = $data;
                $dbBelumMatch->forget($dbByNis->get($nipd)->id);

                continue;
            }

            // Lapis 2: cocokkan nama+JK ke siswa DB yang belum match (mis. NIPD berubah di e-rapor)
            $kandidat = $dbBelumMatch->first(
                fn (Siswa $s) => mb_strtoupper(trim($s->nama)) === mb_strtoupper(trim($data['nama']))
                    && $s->jenis_kelamin === $data['jenis_kelamin']
            );
            if ($kandidat) {
                // NIS disinkronkan ke NIPD file bila NIPD ada dan tidak dipakai siswa lain
                if ($nipd !== null && ! $nisTerpakai->contains($nipd)) {
                    $data['nis'] = $nipd;
                } else {
                    unset($data['nis']);
                }
                $updateById[$kandidat->id] = $data;
                $matchNama[$kandidat->nis] = [$data['nama'], $data['nis'] ?? $kandidat->nis];
                $dbBelumMatch->forget($kandidat->id);

                continue;
            }

            if ($nipd === null) {
                // Lapis 3: insert baru dengan NIS = NISN
                if ($data['_nisn'] === '') {
                    $skip[] = "baris {$key}: tanpa NIPD & NISN ({$data['nama']}) — tidak bisa insert";

                    continue;
                }
                if ($dbByNis->has($data['_nisn']) || isset($insert[$data['_nisn']])) {
                    $skip[] = "NISN {$data['_nisn']} ({$data['nama']}) sudah terpakai — dilewati";

                    continue;
                }
                $data['nis'] = $data['_nisn'];
                $data['_sumber'] = 'NISN';
                $insert[$data['_nisn']] = $data;

                continue;
            }

            // NIPD valid tapi belum ada di DB → insert baru
            $data['_sumber'] = 'NIPD';
            $insert[$nipd] = $data;
        }

        $ringkasan = [
            'baris_valid' => count($rows),
            'insert_nipd' => collect($insert)->where('_sumber', 'NIPD')->count(),
            'insert_nisn' => collect($insert)->where('_sumber', 'NISN')->count(),
            'update_nipd' => count($updateByNis),
            'update_nama' => count($updateById),
            'tidak_disentuh' => $dbBelumMatch->count(),
            'total_insert' => count($insert),
            'total_update' => count($updateByNis) + count($updateById),
            'rombel_tak_dikenal' => array_keys($rombelTakDikenal),
            'tanpa_rombel' => $tanpaRombel,
            'duplikat_file' => count($duplikatFile),
            'dilewati' => count($skip),
            'tahun_ajaran' => $ta->nama,
        ];

        $peringatan = array_merge($peringatan, $duplikatFile, $skip);

        return [
            'ok' => true,
            'ringkasan' => $ringkasan,
            'insert' => $insert,
            'updateByNis' => $updateByNis,
            'updateById' => $updateById,
            'peringatan' => $peringatan,
        ];
    }

    /**
     * Esekusi rencana yang dihasilkan `rencana()` — tulis ke database.
     *
     * @param  array  $plan  hasil `rencana()`
     */
    public function jalankan(array $plan): array
    {
        foreach ($plan['updateByNis'] as $nis => $data) {
            Siswa::where('nis', $nis)->update(collect($data)->except('_nisn', '_sumber')->all());
        }
        foreach ($plan['updateById'] as $id => $data) {
            Siswa::whereKey($id)->update(collect($data)->except('_nisn', '_sumber')->all());
        }

        $barisInsert = collect($plan['insert'])
            ->map(fn ($d) => collect($d)->except('_nisn', '_sumber')->all())
            ->values()
            ->all();

        foreach (array_chunk($barisInsert, 100) as $chunk) {
            Siswa::insert($chunk);
        }

        // Sinkronkan riwayat penempatan (siswa_kelas) untuk semua kelas saat ini
        Siswa::whereNotNull('kelas_rombel_id')->chunkById(200, function ($siswas) {
            foreach ($siswas as $siswa) {
                SiswaKelas::firstOrCreate([
                    'siswa_id' => $siswa->id,
                    'kelas_rombel_id' => $siswa->kelas_rombel_id,
                ]);
            }
        });

        return [
            'insert' => $plan['ringkasan']['total_insert'],
            'update' => $plan['ringkasan']['total_update'],
        ];
    }

    /** Baca NIPD/NISN: angka Excel dikembalikan tanpa notasi ilmiah, string di-trim. */
    private function keyNis($sheet, string $sel): string
    {
        return $this->ambilString($sheet, $sel);
    }

    private function ambilString($sheet, string $sel): string
    {
        $v = $sheet->getCell($sel)->getValue();
        if ($v === null) {
            return '';
        }
        if (is_float($v) && floor($v) === $v) {
            return number_format($v, 0, '', '');
        }
        if (is_int($v)) {
            return (string) $v;
        }

        return trim((string) $v);
    }

    private function ambilTanggal($sheet, string $sel): ?string
    {
        $v = $sheet->getCell($sel)->getValue();
        if ($v === null || (is_string($v) && trim($v) === '')) {
            return null;
        }
        try {
            if (is_numeric($v)) {
                return ExcelDate::excelToDateTimeObject((float) $v)->format('Y-m-d');
            }
            $t = Carbon::parse(trim((string) $v));

            return $t->format('Y-m-d');
        } catch (\Throwable) {
            return null;
        }
    }
}
