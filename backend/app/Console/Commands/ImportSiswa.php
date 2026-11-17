<?php

namespace App\Console\Commands;

use App\Models\KelasRombel;
use App\Models\Siswa;
use App\Models\SiswaKelas;
use App\Models\TahunAjaran;
use Illuminate\Console\Command;
use Illuminate\Support\Carbon;
use PhpOffice\PhpSpreadsheet\IOFactory;
use PhpOffice\PhpSpreadsheet\Shared\Date as ExcelDate;

/**
 * Import siswa dari ekspor e-rapor "Daftar Peserta Didik per Kelas" (.xlsx).
 *
 * Sumber: sheet "Semua Siswa" (baris 5-6 = header dua tingkat, data mulai baris 7).
 * Strategi UPSERT (id siswa lama tetap → data nilai tetap nyambung):
 *   1. Baris ber-NIPD & NIPD ada di DB → update baris tersebut.
 *   2. Baris lain dicocokkan ke siswa DB yang belum ke-match berdasarkan nama
 *      (case-insensitive) + jenis kelamin (mis. NIPD berubah di e-rapor);
 *      NIS disinkronkan ke NIPD file bila tidak dipakai siswa lain.
 *   3. Sisanya → insert baru: NIS = NIPD bila ada, atau NISN bila tanpa NIPD.
 * Siswa DB yang tidak ada di file sama sekali tidak disentuh.
 *
 * Contoh pemakaian:
 *   php artisan siswa:import "C:\Users\bandu\Downloads\Daftar_Siswa_Per_Kelas.xlsx"
 *   php artisan siswa:import <file> --dry-run
 */
class ImportSiswa extends Command
{
    protected $signature = 'siswa:import {file : Path file .xlsx ekspor e-rapor} {--dry-run : Tampilkan ringkasan tanpa menulis ke database}';

    protected $description = 'Import data siswa dari ekspor e-rapor (Daftar Peserta Didik per Kelas)';

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

    public function handle(): int
    {
        $file = (string) $this->argument('file');
        $dryRun = (bool) $this->option('dry-run');

        if (! is_file($file)) {
            $this->error("File tidak ditemukan: {$file}");

            return self::FAILURE;
        }

        $spreadsheet = IOFactory::load($file);
        $sheet = $spreadsheet->getSheetByName('Semua Siswa');
        if ($sheet === null) {
            $this->error("Sheet 'Semua Siswa' tidak ditemukan. Sheet tersedia: ".implode(', ', $spreadsheet->getSheetNames()));

            return self::FAILURE;
        }

        $ta = TahunAjaran::where('is_aktif', true)->first();
        if (! $ta) {
            $this->error('Tidak ada tahun ajaran aktif. Aktifkan dulu di menu Tahun Ajaran.');

            return self::FAILURE;
        }

        $kelasByNama = KelasRombel::where('tahun_ajaran_id', $ta->id)
            ->get()
            ->mapWithKeys(fn (KelasRombel $k) => [$k->nama => $k->id]);

        // Tahap 1: baca baris mentah
        $rows = [];
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
                $this->warn("baris {$r}: JK tidak valid ({$data['jenis_kelamin']}) — dilewati");

                continue;
            }

            $data['tanggal_lahir'] = $this->ambilTanggal($sheet, 'G'.$r);
            $data['kelas_rombel_id'] = $kelasId;
            $data['is_aktif'] = true;
            $data['_nisn'] = $nisn;

            $rows[$key] = $data;
        }

        // Tahap 2: putuskan aksi per baris
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

        $jumlahInsert = count($insert);
        $jumlahUpdateNis = count($updateByNis);
        $jumlahUpdateNama = count($updateById);
        $tidakDisentuh = $dbBelumMatch->count();

        $this->info('Ringkasan import (sheet "Semua Siswa"):');
        $this->table(
            ['Metrik', 'Nilai'],
            [
                ['Baris data valid', count($rows)],
                ['Insert baru (NIS = NIPD)', collect($insert)->where('_sumber', 'NIPD')->count()],
                ['Insert baru (NIS = NISN, tanpa NIPD)', collect($insert)->where('_sumber', 'NISN')->count()],
                ['Update (match NIPD)', $jumlahUpdateNis],
                ['Update (match nama+JK)', $jumlahUpdateNama],
                ['Siswa DB tidak ada di file (tidak disentuh)', $tidakDisentuh],
                ['Rombel di file tanpa kelas di DB', $rombelTakDikenal ? implode(', ', array_keys($rombelTakDikenal)) : '-'],
                ['Siswa tanpa rombel di file', $tanpaRombel > 0 ? "{$tanpaRombel} siswa" : '-'],
                ['NIS duplikat di file', $duplikatFile ? count($duplikatFile).' baris' : '-'],
                ['Dilewati (data tidak cukup/bentrok)', $skip ? count($skip) : '-'],
            ]
        );
        foreach ([...$duplikatFile, ...$skip] as $pesan) {
            $this->warn($pesan);
        }
        foreach ($matchNama as $nisLama => [$nama, $nisBaru]) {
            $this->line("  match nama: {$nama} — NIS {$nisLama} → {$nisBaru}");
        }
        if ($rombelTakDikenal) {
            $this->warn('Siswa dengan rombel di atas diimport TANPA kelas (kelas_rombel_id NULL). Buat kelasnya dulu bila diperlukan.');
        }

        if ($dryRun) {
            $this->line('Mode --dry-run: tidak ada perubahan database.');

            return self::SUCCESS;
        }

        if (! $this->confirm('Lanjutkan menulis ke database?', true)) {
            return self::SUCCESS;
        }

        foreach ($updateByNis as $nis => $data) {
            Siswa::where('nis', $nis)->update(collect($data)->except('_nisn', '_sumber')->all());
        }
        foreach ($updateById as $id => $data) {
            Siswa::whereKey($id)->update(collect($data)->except('_nisn', '_sumber')->all());
        }

        $barisInsert = collect($insert)->map(fn ($d) => collect($d)->except('_nisn', '_sumber')->all())->values()->all();
        foreach (array_chunk($barisInsert, 100) as $chunk) {
            Siswa::insert($chunk);
        }

        // Sinkronkan riwayat penempatan (siswa_kelas) untuk semua kelas saat ini
        $now = now();
        Siswa::whereNotNull('kelas_rombel_id')->chunkById(200, function ($siswas) {
            foreach ($siswas as $siswa) {
                SiswaKelas::firstOrCreate([
                    'siswa_id' => $siswa->id,
                    'kelas_rombel_id' => $siswa->kelas_rombel_id,
                ]);
            }
        });

        $this->info("Selesai: {$jumlahInsert} insert, ".($jumlahUpdateNis + $jumlahUpdateNama).' update.');

        return self::SUCCESS;
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
