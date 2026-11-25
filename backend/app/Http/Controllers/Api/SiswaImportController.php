<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\KelasRombel;
use App\Models\Siswa;
use App\Models\TahunAjaran;
use App\Services\ImportSiswaService;
use Illuminate\Http\Request;
use PhpOffice\PhpSpreadsheet\Cell\DataType;
use PhpOffice\PhpSpreadsheet\Cell\DataValidation;
use PhpOffice\PhpSpreadsheet\Shared\Date as ExcelDate;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;

class SiswaImportController extends Controller
{
    public function __construct(private ImportSiswaService $service) {}

    /**
     * Unduh template import siswa (.xlsx) yang kompatibel dengan endpoint
     * POST /siswa/import: sheet "Semua Siswa", data mulai baris 7.
     * Data siswa yang sudah ada ikut diisi agar bisa diedit lalu diimport ulang.
     */
    public function template()
    {
        $tahun = TahunAjaran::where('is_aktif', true)->first();
        abort_unless($tahun, 422, 'Tidak ada tahun ajaran aktif. Aktifkan dulu di menu Tahun Ajaran.');

        $kelas = KelasRombel::where('tahun_ajaran_id', $tahun->id)
            ->orderBy('nama')
            ->pluck('nama')
            ->all();

        $siswas = Siswa::with('kelasRombel')
            ->orderByRaw('kelas_rombel_id IS NULL')
            ->orderBy('nama')
            ->get();

        $spreadsheet = new Spreadsheet;
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->setTitle('Semua Siswa');

        $sheet->mergeCells('A1:BF1');
        $sheet->setCellValue('A1', 'TEMPLATE IMPORT DATA SISWA');
        $sheet->getStyle('A1')->getFont()->setBold(true)->setSize(14);
        $sheet->getStyle('A1')->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);

        $sheet->mergeCells('A2:BF2');
        $sheet->setCellValue('A2', "Tahun Ajaran {$tahun->nama} · Data mulai baris 7. Kolom yang tidak dipakai boleh dikosongkan.");
        $sheet->getStyle('A2')->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);

        $sheet->mergeCells('A3:BF3');
        $sheet->setCellValue('A3', 'NIPD wajib diisi. JK hanya L/P. Rombel contoh: 7A / 8B (harus sama dengan nama kelas di sistem).');
        $sheet->getStyle('A3')->getFont()->setItalic(true)->setSize(9)
            ->getColor()->setARGB('FF64748B');

        $header = [
            'A' => 'No', 'B' => 'Nama', 'C' => 'NIPD', 'D' => 'JK', 'E' => 'NISN',
            'F' => 'Tempat Lahir', 'G' => 'Tanggal Lahir', 'I' => 'Agama', 'J' => 'Alamat',
            'T' => 'No. HP', 'Y' => 'Nama Ayah', 'AB' => 'Profesi Ayah',
            'AE' => 'Nama Ibu', 'AH' => 'Profesi Ibu', 'AK' => 'Nama Wali',
            'AN' => 'Pekerjaan Wali', 'AQ' => 'Rombel', 'BE' => 'Sekolah Asal', 'BF' => 'Anak Ke',
        ];
        foreach ($header as $kolom => $label) {
            $sheet->setCellValue($kolom.'5', $label);
        }

        $sheet->getStyle('A5:BF5')->getFont()->setBold(true);
        $sheet->getStyle('A5:BF5')->getFill()
            ->setFillType(Fill::FILL_SOLID)
            ->getStartColor()->setARGB('FFE7F3EF');
        $sheet->getStyle('A5:BF5')->getAlignment()
            ->setHorizontal(Alignment::HORIZONTAL_CENTER)
            ->setWrapText(true);

        $baris = 7;
        foreach ($siswas as $i => $siswa) {
            $sheet->setCellValue("A{$baris}", $i + 1);
            $sheet->setCellValue("B{$baris}", $siswa->nama);
            $sheet->setCellValueExplicit("C{$baris}", (string) $siswa->nis, DataType::TYPE_STRING);
            $sheet->setCellValue("D{$baris}", $siswa->jenis_kelamin);
            $sheet->setCellValue("F{$baris}", $siswa->tempat_lahir);
            if ($siswa->tanggal_lahir) {
                $sheet->setCellValue("G{$baris}", ExcelDate::PHPToExcel($siswa->tanggal_lahir));
                $sheet->getStyle("G{$baris}")->getNumberFormat()->setFormatCode('dd-mm-yyyy');
            }
            $sheet->setCellValue("I{$baris}", $siswa->agama);
            $sheet->setCellValue("J{$baris}", $siswa->alamat);
            $sheet->setCellValueExplicit("T{$baris}", (string) ($siswa->no_telp ?? ''), DataType::TYPE_STRING);
            $sheet->setCellValue("Y{$baris}", $siswa->nama_ayah);
            $sheet->setCellValue("AB{$baris}", $siswa->profesi_ayah);
            $sheet->setCellValue("AE{$baris}", $siswa->nama_ibu);
            $sheet->setCellValue("AH{$baris}", $siswa->profesi_ibu);
            $sheet->setCellValue("AK{$baris}", $siswa->nama_wali);
            $sheet->setCellValue("AN{$baris}", $siswa->pekerjaan_wali);
            $sheet->setCellValue("AQ{$baris}", $siswa->kelasRombel?->nama);
            $sheet->setCellValue("BE{$baris}", $siswa->sekolah_asal);
            $sheet->setCellValue("BF{$baris}", $siswa->anak_ke);
            $baris++;
        }

        $akhir = max(7, $baris - 1);
        $sheet->getStyle("A5:BF{$akhir}")->getBorders()->applyFromArray([
            'allBorders' => ['borderStyle' => Border::BORDER_THIN, 'color' => ['argb' => 'FFCBD5E1']],
        ]);

        $width = ['A' => 5, 'B' => 30, 'C' => 14, 'D' => 6, 'E' => 14, 'F' => 18, 'G' => 14, 'I' => 12, 'J' => 32, 'T' => 16, 'AQ' => 10, 'BE' => 22, 'BF' => 8];
        foreach ($width as $kolom => $lebar) {
            $sheet->getColumnDimension($kolom)->setWidth($lebar);
        }

        // Validasi agar input konsisten dengan parser import.
        $this->pasangValidasi($sheet, 'D7:D500', DataValidation::TYPE_LIST, '"L,P"');
        $this->pasangValidasi($sheet, 'BF7:BF500', DataValidation::TYPE_WHOLE, '0', '99');
        if ($kelas !== []) {
            $daftarKelas = '"'.implode(',', array_slice($kelas, 0, 30)).'"';
            if (strlen($daftarKelas) <= 255) {
                $this->pasangValidasi($sheet, 'AQ7:AQ500', DataValidation::TYPE_LIST, $daftarKelas);
            }
        }

        $sheet->freezePane('A7');

        // Sheet petunjuk singkat
        $petunjuk = $spreadsheet->createSheet();
        $petunjuk->setTitle('Petunjuk');
        $petunjuk->setCellValue('A1', 'PETUNJUK IMPORT SISWA');
        $petunjuk->getStyle('A1')->getFont()->setBold(true)->setSize(13);
        $lines = [
            '1. Isi/perbarui data mulai baris 7 pada sheet "Semua Siswa".',
            '2. NIPD (kolom C) menjadi kunci utama. NISN (kolom E) dipakai bila NIPD kosong.',
            '3. JK harus L atau P. Rombel harus sama dengan nama kelas di sistem (contoh: 7A).',
            '4. Tanggal lahir boleh format tanggal Excel (dd-mm-yyyy) atau teks yang bisa dibaca sistem.',
            '5. Baris yang tidak ada di file tidak akan dihapus dari database.',
            '6. Disarankan memakai Pratinjau di menu import sebelum menyimpan.',
        ];
        foreach ($lines as $i => $line) {
            $petunjuk->setCellValue('A'.($i + 3), $line);
        }
        $petunjuk->getColumnDimension('A')->setWidth(110);

        $namaFile = 'Template_Import_Siswa_'.str_replace(['/', '\\'], '-', $tahun->nama).'.xlsx';
        $berkas = tempnam(sys_get_temp_dir(), 'sipp-template-siswa-');
        (new Xlsx($spreadsheet))->save($berkas);

        return response()->download($berkas, $namaFile, [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ])->deleteFileAfterSend(true);
    }

    /** Pasang data validation sederhana pada satu rentang. */
    private function pasangValidasi($sheet, string $rentang, string $tipe, string $formula1, ?string $formula2 = null): void
    {
        $validation = new DataValidation;
        $validation->setType($tipe);
        $validation->setAllowBlank(true);
        $validation->setShowErrorMessage(true);
        $validation->setErrorTitle('Data tidak valid');
        $validation->setError('Nilai pada kolom ini tidak sesuai format template.');
        $validation->setFormula1($formula1);
        if ($formula2 !== null) {
            $validation->setOperator(DataValidation::OPERATOR_BETWEEN);
            $validation->setFormula2($formula2);
        }
        $sheet->setDataValidation($rentang, $validation);
    }

    /**
     * Import siswa dari file .xlsx ekspor e-rapor "Daftar Peserta Didik per Kelas".
     *
     * Dua mode:
     *   - `dry_run=1` → hanya analisis + ringkasan (tidak menulis database).
     *   - tanpa `dry_run` → analisis lalu langsung tulis ke database.
     *
     * File wajib punya sheet "Semua Siswa" pada TA yang sedang aktif.
     */
    public function store(Request $request)
    {
        $request->validate([
            'file' => ['required', 'file', 'mimes:xlsx,xls', 'max:20480'],
            'dry_run' => ['nullable', 'boolean'],
        ], [
            'file.mimes' => 'File harus berformat Excel (.xlsx).',
            'file.max' => 'Ukuran file maksimal 20 MB.',
        ]);

        $path = $request->file('file')->getRealPath();
        $plan = $this->service->rencana($path);

        if (! $plan['ok']) {
            return response()->json(['message' => $plan['error']], 422);
        }

        $dryRun = $request->boolean('dry_run');

        if ($dryRun) {
            return response()->json([
                'dry_run' => true,
                'ringkasan' => $plan['ringkasan'],
                'peringatan' => array_slice($plan['peringatan'], 0, 20),
            ]);
        }

        $hasil = $this->service->jalankan($plan);

        return response()->json([
            'dry_run' => false,
            'hasil' => $hasil,
            'ringkasan' => $plan['ringkasan'],
            'peringatan' => array_slice($plan['peringatan'], 0, 20),
        ]);
    }
}
