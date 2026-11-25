<?php

namespace App\Services;

use App\Models\KelasRombel;
use App\Models\LogEditNilai;
use App\Models\MapelPlus;
use App\Models\NilaiMapel;
use App\Models\Semester;
use App\Models\Siswa;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use PhpOffice\PhpSpreadsheet\Cell\Coordinate;
use PhpOffice\PhpSpreadsheet\Cell\DataType;
use PhpOffice\PhpSpreadsheet\Cell\DataValidation;
use PhpOffice\PhpSpreadsheet\IOFactory;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Fill;

/**
 * Template & import nilai massal per kelas/semester.
 *
 * Template memuat kolom nilai untuk mapel yang boleh diubah user (admin/wali
 * kelas = semua mapel, guru mapel = mapel yang diampu). Baris data memakai NIS
 * sebagai kunci sehingga aman walau nama siswa berubah. Import hanya menyentuh
 * kolom mapel yang ada di file dan sudah divalidasi hak aksesnya.
 */
class ImportNilaiService
{
    /** Penanda baris tersembunyi berisi ID mapel per kolom. */
    private const META_MAPEL_ID = '__MAPEL_ID__';

    /**
     * Bangun spreadsheet template import nilai.
     *
     * @param  Collection<int, MapelPlus>  $mapels
     * @param  Collection<int, Siswa>  $siswas
     */
    public function buatTemplate(KelasRombel $kelas, Semester $semester, Collection $mapels, Collection $siswas): Spreadsheet
    {
        $spreadsheet = new Spreadsheet;
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->setTitle('Nilai');

        $kolomAkhir = Coordinate::stringFromColumnIndex(3 + $mapels->count());

        $sheet->mergeCells("A1:{$kolomAkhir}1");
        $sheet->setCellValue('A1', 'TEMPLATE IMPORT NILAI KELAS '.$kelas->nama);
        $sheet->getStyle('A1')->getFont()->setBold(true)->setSize(14);
        $sheet->getStyle('A1')->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);

        $sheet->mergeCells("A2:{$kolomAkhir}2");
        $sheet->setCellValue('A2', "Semester {$semester->nama} · Tahun Ajaran {$semester->tahunAjaran->nama}");
        $sheet->getStyle('A2')->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);

        $sheet->mergeCells("A3:{$kolomAkhir}3");
        $sheet->setCellValue('A3', 'Isi nilai 0-100. Kosongkan sel untuk menghapus nilai. Jangan mengubah NIS, nama, atau judul kolom.');
        $sheet->getStyle('A3')->getFont()->setItalic(true)->setSize(9)
            ->getColor()->setARGB('FF64748B');

        // Baris metadata tersembunyi: A4 = penanda, kolom mapel = ID mapel.
        $sheet->setCellValue('A4', self::META_MAPEL_ID);
        $kolom = 4;
        foreach ($mapels as $mapel) {
            $sheet->setCellValueExplicit(
                Coordinate::stringFromColumnIndex($kolom).'4',
                (string) $mapel->id,
                DataType::TYPE_STRING
            );
            $kolom++;
        }
        $sheet->getRowDimension(4)->setVisible(false);

        $header = ['No', 'NIS', 'Nama Siswa'];
        foreach ($mapels as $mapel) {
            $header[] = $mapel->nama;
        }
        $sheet->fromArray($header, null, 'A5');

        $sheet->getStyle("A5:{$kolomAkhir}5")->getFont()->setBold(true);
        $sheet->getStyle("A5:{$kolomAkhir}5")->getFill()
            ->setFillType(Fill::FILL_SOLID)
            ->getStartColor()->setARGB('FFE7F3EF');
        $sheet->getStyle("A5:{$kolomAkhir}5")->getAlignment()
            ->setHorizontal(Alignment::HORIZONTAL_CENTER)
            ->setWrapText(true);

        $nilai = NilaiMapel::where('semester_id', $semester->id)
            ->whereIn('siswa_id', $siswas->pluck('id'))
            ->whereIn('mapel_plus_id', $mapels->pluck('id'))
            ->get()
            ->groupBy('siswa_id');

        $barisExcel = 6;
        foreach ($siswas as $i => $siswa) {
            $sheet->setCellValue("A{$barisExcel}", $i + 1);
            $sheet->setCellValueExplicit("B{$barisExcel}", (string) $siswa->nis, DataType::TYPE_STRING);
            $sheet->setCellValue("C{$barisExcel}", $siswa->nama);

            $tersimpan = $nilai->get($siswa->id)?->keyBy('mapel_plus_id');
            $kolom = 4;
            foreach ($mapels as $mapel) {
                $sheet->setCellValue(
                    Coordinate::stringFromColumnIndex($kolom).$barisExcel,
                    $tersimpan?->get($mapel->id)?->nilai
                );
                $kolom++;
            }
            $barisExcel++;
        }

        $akhirData = max(5, $barisExcel - 1);
        $sheet->getStyle("A5:{$kolomAkhir}{$akhirData}")->getBorders()->applyFromArray([
            'allBorders' => ['borderStyle' => Border::BORDER_THIN, 'color' => ['argb' => 'FFCBD5E1']],
        ]);

        $sheet->getColumnDimension('A')->setWidth(5);
        $sheet->getColumnDimension('B')->setWidth(14);
        $sheet->getColumnDimension('C')->setWidth(30);
        for ($k = 4; $k <= 3 + $mapels->count(); $k++) {
            $sheet->getColumnDimension(Coordinate::stringFromColumnIndex($k))->setWidth(16);
        }

        // Validasi nilai 0-100 untuk 500 baris pertama.
        $validation = new DataValidation;
        $validation->setType(DataValidation::TYPE_DECIMAL);
        $validation->setOperator(DataValidation::OPERATOR_BETWEEN);
        $validation->setAllowBlank(true);
        $validation->setFormula1('0');
        $validation->setFormula2('100');
        $validation->setShowErrorMessage(true);
        $validation->setErrorTitle('Nilai tidak valid');
        $validation->setError('Nilai harus berupa angka 0-100.');
        for ($k = 4; $k <= 3 + $mapels->count(); $k++) {
            $kolomHuruf = Coordinate::stringFromColumnIndex($k);
            $sheet->setDataValidation("{$kolomHuruf}6:{$kolomHuruf}500", $validation);
        }

        $sheet->freezePane('A6');

        return $spreadsheet;
    }

    /**
     * Baca file import dan susun rencana perubahan (tanpa menulis database).
     *
     * @param  Collection<int, MapelPlus>  $mapelsBoleh
     * @param  Collection<int, Siswa>  $siswas
     * @return array{
     *   ok: bool, error?: string, errors?: string[],
     *   nilai?: array<int, array<int, int|float|null>>,
     *   siswa_ids?: array<int, true>,
     *   terisi?: int, kosong?: int, jumlah_baris?: int,
     *   semester_id?: int
     * }
     */
    public function rencana(string $file, Semester $semester, Collection $mapelsBoleh, Collection $siswas): array
    {
        if (! is_file($file)) {
            return ['ok' => false, 'error' => 'File tidak ditemukan.'];
        }

        try {
            $spreadsheet = IOFactory::load($file);
        } catch (\Throwable $e) {
            return ['ok' => false, 'error' => 'File tidak bisa dibaca sebagai Excel (.xlsx). '.$e->getMessage()];
        }

        $sheet = $spreadsheet->getActiveSheet();
        $mapelsBoleh = $mapelsBoleh->keyBy('id');
        $errors = [];

        $barisHeader = null;
        $barisMeta = null;
        $batasScan = min(30, $sheet->getHighestRow());
        for ($r = 1; $r <= $batasScan; $r++) {
            if ($barisHeader === null) {
                $b = strtoupper(trim($this->nilaiString($sheet, 'B'.$r)));
                $c = strtoupper(trim($this->nilaiString($sheet, 'C'.$r)));
                if ($b === 'NIS' && str_starts_with($c, 'NAMA')) {
                    $barisHeader = $r;
                }
            }
            if ($barisMeta === null && $this->nilaiString($sheet, 'A'.$r) === self::META_MAPEL_ID) {
                $barisMeta = $r;
            }
            if ($barisHeader !== null && $barisMeta !== null) {
                break;
            }
        }

        if ($barisHeader === null) {
            return ['ok' => false, 'error' => 'Header tidak dikenali. Gunakan template import nilai yang diunduh dari aplikasi.'];
        }

        $kolomTerakhir = Coordinate::columnIndexFromString($sheet->getHighestColumn());
        $kolomMapel = []; // index kolom Excel => MapelPlus

        if ($barisMeta !== null) {
            for ($k = 4; $k <= $kolomTerakhir; $k++) {
                $raw = $this->nilaiString($sheet, Coordinate::stringFromColumnIndex($k).$barisMeta);
                if ($raw === '' || ! is_numeric($raw)) {
                    continue;
                }
                $id = (int) $raw;
                if (! $mapelsBoleh->has($id)) {
                    $errors[] = "Kolom mata pelajaran ID {$id} tidak boleh Anda ubah.";

                    continue;
                }
                $kolomMapel[$k] = $mapelsBoleh->get($id);
            }
        } else {
            for ($k = 4; $k <= $kolomTerakhir; $k++) {
                $nama = trim($this->nilaiString($sheet, Coordinate::stringFromColumnIndex($k).$barisHeader));
                if ($nama === '') {
                    continue;
                }
                $mapel = $mapelsBoleh->first(
                    fn (MapelPlus $m) => mb_strtolower(trim($m->nama)) === mb_strtolower($nama)
                );
                if (! $mapel) {
                    $errors[] = "Kolom '{$nama}' bukan mata pelajaran yang boleh Anda ubah.";

                    continue;
                }
                $kolomMapel[$k] = $mapel;
            }
        }

        if ($kolomMapel === []) {
            return ['ok' => false, 'error' => 'Tidak ada kolom mata pelajaran yang bisa diimport dari file ini.'];
        }

        $byNis = $siswas->keyBy(fn (Siswa $s) => trim((string) $s->nis));
        $byNama = $siswas
            ->groupBy(fn (Siswa $s) => mb_strtolower(trim($s->nama)))
            ->filter(fn ($grup) => $grup->count() === 1)
            ->map(fn ($grup) => $grup->first());

        $nilai = [];
        $siswaIds = [];
        $terisi = 0;
        $kosong = 0;
        $jumlahBaris = 0;

        for ($r = $barisHeader + 1; $r <= $sheet->getHighestRow(); $r++) {
            $nis = trim($this->nilaiString($sheet, 'B'.$r));
            $nama = trim($this->nilaiString($sheet, 'C'.$r));
            if ($nis === '' && $nama === '') {
                continue;
            }

            $siswa = $byNis->get($nis);
            if (! $siswa && $nama !== '') {
                $siswa = $byNama->get(mb_strtolower($nama));
            }
            if (! $siswa) {
                $errors[] = "Baris {$r}: siswa NIS ".($nis !== '' ? $nis : '-')." ({$nama}) tidak ditemukan di kelas ini.";

                continue;
            }

            $siswaIds[$siswa->id] = true;
            $jumlahBaris++;

            foreach ($kolomMapel as $k => $mapel) {
                $raw = trim($this->nilaiString($sheet, Coordinate::stringFromColumnIndex($k).$r));
                if ($raw === '') {
                    $nilai[$mapel->id][$siswa->id] = null;
                    $kosong++;

                    continue;
                }

                $raw = str_replace(',', '.', $raw);
                if (! is_numeric($raw)) {
                    $errors[] = "Baris {$r} ({$siswa->nama}): nilai {$mapel->nama} bukan angka.";

                    continue;
                }
                $angka = (float) $raw;
                if ($angka < 0 || $angka > 100) {
                    $errors[] = "Baris {$r} ({$siswa->nama}): nilai {$mapel->nama} harus 0-100.";

                    continue;
                }

                $nilai[$mapel->id][$siswa->id] = floor($angka) === $angka ? (int) $angka : $angka;
                $terisi++;
            }
        }

        if ($errors !== []) {
            return [
                'ok' => false,
                'error' => 'File belum bisa diimport. Perbaiki data berikut lalu coba lagi.',
                'errors' => array_slice($errors, 0, 20),
            ];
        }

        if ($jumlahBaris === 0) {
            return ['ok' => false, 'error' => 'Tidak ada baris siswa yang bisa dibaca. Pastikan NIS sesuai data kelas.'];
        }

        return [
            'ok' => true,
            'nilai' => $nilai,
            'siswa_ids' => $siswaIds,
            'terisi' => $terisi,
            'kosong' => $kosong,
            'jumlah_baris' => $jumlahBaris,
            'semester_id' => $semester->id,
        ];
    }

    /**
     * Tulis rencana import ke database.
     *
     * @param  array  $plan  hasil rencana()
     */
    public function jalankan(array $plan, int $userId): array
    {
        return DB::transaction(function () use ($plan, $userId) {
            $mapels = MapelPlus::whereIn('id', array_keys($plan['nilai']))->get()->keyBy('id');

            foreach ($plan['nilai'] as $mapelId => $perSiswa) {
                $mapel = $mapels->get($mapelId);
                if (! $mapel) {
                    continue;
                }

                foreach ($perSiswa as $siswaId => $nilai) {
                    $row = NilaiMapel::firstOrNew([
                        'siswa_id' => $siswaId,
                        'mapel_plus_id' => $mapelId,
                        'semester_id' => $plan['semester_id'],
                    ]);
                    if (! $row->exists) {
                        $row->kkm = $mapel->kkm_default ?? 75;
                    }
                    $row->nilai = $nilai;
                    $row->save();
                }
            }

            foreach (array_keys($plan['siswa_ids']) as $siswaId) {
                LogEditNilai::updateOrCreate(
                    ['siswa_id' => $siswaId, 'semester_id' => $plan['semester_id']],
                    ['updated_by' => $userId]
                );
            }

            return [
                'mapel' => count($plan['nilai']),
                'siswa' => count($plan['siswa_ids']),
                'nilai_terisi' => $plan['terisi'],
                'nilai_kosong' => $plan['kosong'],
            ];
        });
    }

    /** Baca sel sebagai string tanpa notasi ilmiah untuk NIS/angka bulat. */
    private function nilaiString($sheet, string $sel): string
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
}
