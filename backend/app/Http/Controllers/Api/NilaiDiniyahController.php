<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Concerns\ScopesSiswaAccess;
use App\Http\Controllers\Controller;
use App\Models\GuruMapelKelas;
use App\Models\KehadiranRekap;
use App\Models\KelasRombel;
use App\Models\LogEditNilai;
use App\Models\MapelPlus;
use App\Models\Nilai;
use App\Models\NilaiMapel;
use App\Models\NilaiPraktik;
use App\Models\Pembiasaan;
use App\Models\PraktikItem;
use App\Models\PredikatRange;
use App\Models\Semester;
use App\Models\Sikap;
use App\Models\Siswa;
use App\Models\User;
use App\Support\NilaiDiniyah;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use PhpOffice\PhpSpreadsheet\Cell\Coordinate;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;

class NilaiDiniyahController extends Controller
{
    use ScopesSiswaAccess;

    /**
     * Data untuk form input nilai diniyah satu siswa per semester:
     * nilai per mapel (langsung + agregasi assessment), praktik & hafalan,
     * pembiasaan pagi, sikap, rekap kehadiran, dan jejak edit terakhir.
     */
    public function rekap(Request $request)
    {
        $data = $request->validate([
            'siswa_id' => ['required', 'exists:siswas,id'],
            'semester_id' => ['required', 'exists:semesters,id'],
        ]);

        $this->pastikanBolehLihatSiswa($request, (int) $data['siswa_id']);

        $user = $request->user();
        $siswa = Siswa::with('kelasRombel')->findOrFail($data['siswa_id']);
        $semester = Semester::findOrFail($data['semester_id']);

        $mapelList = $this->mapelRekap($siswa, $semester, $user);
        $praktikList = $this->praktikRekap($siswa, $semester, $user);
        $lengkap = $this->userBolehLengkap($user, $siswa);

        return response()->json([
            'siswa' => [
                'id' => $siswa->id,
                'nama' => $siswa->nama,
                'nis' => $siswa->nis,
                'kelas' => $siswa->kelasRombel?->nama,
            ],
            'semester' => [
                'id' => $semester->id,
                'nama' => $semester->nama,
                'tahun' => $semester->tahunAjaran->nama,
                'penilaian_dibuka' => $semester->penilaian_dibuka,
            ],
            'mapel' => $mapelList,
            'praktik' => $praktikList,
            'pembiasaan' => Pembiasaan::where('siswa_id', $siswa->id)->where('semester_id', $semester->id)->first(),
            'sikap' => Sikap::where('siswa_id', $siswa->id)->where('semester_id', $semester->id)->first(),
            'kehadiran' => KehadiranRekap::where('siswa_id', $siswa->id)->where('semester_id', $semester->id)->first(),
            'log_edit' => LogEditNilai::with('updater')->where('siswa_id', $siswa->id)->where('semester_id', $semester->id)->first(),
            'bisa_edit_pembiasaan' => $lengkap,
        ]);
    }

    /**
     * Simpan nilai diniyah satu siswa: mapel (mix dengan agregasi), praktik,
     * pembiasaan, sikap & kehadiran dalam satu klik. Sekaligus membubuhkan
     * jejak 'terakhir diubah' (log_edit_nilais).
     */
    public function simpan(Request $request)
    {
        $data = $request->validate([
            'siswa_id' => ['required', 'exists:siswas,id'],
            'semester_id' => ['required', 'exists:semesters,id'],
            'nilai_mapel' => ['sometimes', 'array'],
            'nilai_mapel.*.mapel_plus_id' => ['required', 'exists:mapel_plus,id'],
            'nilai_mapel.*.kkm' => ['required', 'integer', 'between:1,100'],
            'nilai_mapel.*.nilai' => ['nullable', 'integer', 'between:0,100'],
            'nilai_praktik' => ['sometimes', 'array'],
            'nilai_praktik.*.praktik_item_id' => ['required', 'exists:praktik_items,id'],
            'nilai_praktik.*.nilai' => ['nullable', 'in:A,B,C,D'],
            'nilai_praktik.*.keterangan' => ['nullable', 'string', 'max:255'],
            'pembiasaan' => ['sometimes', 'array'],
            'pembiasaan.nilai' => ['nullable', 'integer', 'between:0,100'],
            'sikap' => ['sometimes', 'array'],
            'sikap.akhlaq' => ['nullable', 'in:A,B,C,D'],
            'sikap.kepribadian' => ['nullable', 'in:A,B,C,D'],
            'kehadiran' => ['sometimes', 'array'],
            'kehadiran.sakit' => ['sometimes', 'integer', 'min:0'],
            'kehadiran.izin' => ['sometimes', 'integer', 'min:0'],
            'kehadiran.alpa' => ['sometimes', 'integer', 'min:0'],
        ]);

        $user = $request->user();
        $siswa = Siswa::with('kelasRombel')->findOrFail($data['siswa_id']);
        $semester = Semester::findOrFail($data['semester_id']);

        abort_unless($semester->penilaian_dibuka, 422, 'Periode penilaian semester ini sudah ditutup.');

        $lengkap = $this->userBolehLengkap($user, $siswa);
        $mapelBoleh = $this->mapelBolehD($request, $siswa, $semester);
        $praktikBoleh = $this->praktikBolehD($user, $siswa, $semester);

        if (isset($data['nilai_mapel'])) {
            foreach ($data['nilai_mapel'] as $item) {
                abort_unless($mapelBoleh->contains($item['mapel_plus_id']), 403, 'Anda tidak mengampu mata pelajaran ini di kelas siswa tersebut.');
                NilaiMapel::updateOrCreate(
                    [
                        'siswa_id' => $siswa->id,
                        'mapel_plus_id' => $item['mapel_plus_id'],
                        'semester_id' => $semester->id,
                    ],
                    ['kkm' => $item['kkm'], 'nilai' => $item['nilai'] ?? null]
                );
            }
        }

        if (isset($data['nilai_praktik'])) {
            foreach ($data['nilai_praktik'] as $item) {
                abort_unless($praktikBoleh->contains($item['praktik_item_id']), 403, 'Anda tidak mengampu item praktik/hafalan ini.');
                NilaiPraktik::updateOrCreate(
                    [
                        'siswa_id' => $siswa->id,
                        'praktik_item_id' => $item['praktik_item_id'],
                        'semester_id' => $semester->id,
                    ],
                    [
                        'nilai' => $item['nilai'] ?? null,
                        'keterangan' => $item['keterangan'] ?? null,
                    ]
                );
            }
        }

        if (isset($data['pembiasaan']) || isset($data['sikap']) || isset($data['kehadiran'])) {
            abort_unless($lengkap, 403, 'Hanya wali kelas atau admin yang dapat mengisi pembiasaan, sikap, dan kehadiran.');
        }

        if (isset($data['pembiasaan'])) {
            Pembiasaan::updateOrCreate(
                ['siswa_id' => $siswa->id, 'semester_id' => $semester->id],
                ['nilai' => $data['pembiasaan']['nilai'] ?? null]
            );
        }

        if (isset($data['sikap'])) {
            Sikap::updateOrCreate(
                ['siswa_id' => $siswa->id, 'semester_id' => $semester->id],
                [
                    'akhlaq' => $data['sikap']['akhlaq'] ?? null,
                    'kepribadian' => $data['sikap']['kepribadian'] ?? null,
                ]
            );
        }

        if (isset($data['kehadiran'])) {
            KehadiranRekap::updateOrCreate(
                ['siswa_id' => $siswa->id, 'semester_id' => $semester->id],
                [
                    'sakit' => $data['kehadiran']['sakit'] ?? 0,
                    'izin' => $data['kehadiran']['izin'] ?? 0,
                    'alpa' => $data['kehadiran']['alpa'] ?? 0,
                ]
            );
        }

        LogEditNilai::updateOrCreate(
            ['siswa_id' => $siswa->id, 'semester_id' => $semester->id],
            ['updated_by' => $user->id]
        );

        return response()->json(['message' => 'Nilai diniyah berhasil disimpan.']);
    }

    /**
     * Input massal NILAI AKHIR LANGSUNG satu mapel untuk seluruh siswa
     * satu kelas (guru mapel / wali kelas / admin). Asesmen menjadi OPSIONAL:
     * nilai langsung ini menimpa hasil perhitungan bobot asesmen dan langsung
     * terpakai di rapor & rekap wali kelas (nilai efektif = langsung ?? agregat).
     * Payload: { mapel_plus_id, kelas_rombel_id, semester_id, nilai: [{siswa_id, nilai}] }
     */
    public function simpanMassal(Request $request)
    {
        $data = $request->validate([
            'mapel_plus_id' => ['required', 'exists:mapel_plus,id'],
            'kelas_rombel_id' => ['required', 'exists:kelas_rombels,id'],
            'semester_id' => ['required', 'exists:semesters,id'],
            'nilai' => ['required', 'array', 'min:1'],
            'nilai.*.siswa_id' => ['required', 'exists:siswas,id'],
            'nilai.*.kkm' => ['nullable', 'integer', 'between:1,100'],
            'nilai.*.nilai' => ['nullable', 'integer', 'between:0,100'],
        ], [
            'nilai.*.nilai.between' => 'Nilai harus di antara 0-100.',
        ]);

        $user = $request->user();
        $semester = Semester::findOrFail($data['semester_id']);
        abort_unless($semester->penilaian_dibuka, 422, 'Periode penilaian semester ini sudah ditutup.');

        $kelas = KelasRombel::findOrFail($data['kelas_rombel_id']);
        $this->pastikanBolehNilaiMassal($user, (int) $data['mapel_plus_id'], $kelas, $semester);

        // Semua siswa harus terdaftar di kelas tersebut
        $siswaKelas = Siswa::where('kelas_rombel_id', $kelas->id)->pluck('id');
        foreach (collect($data['nilai'])->pluck('siswa_id') as $siswaId) {
            abort_unless($siswaKelas->contains($siswaId), 422, 'Terdapat siswa yang tidak terdaftar di kelas ini.');
        }

        $mapel = MapelPlus::findOrFail($data['mapel_plus_id']);

        foreach ($data['nilai'] as $item) {
            NilaiMapel::updateOrCreate(
                [
                    'siswa_id' => $item['siswa_id'],
                    'mapel_plus_id' => $mapel->id,
                    'semester_id' => $semester->id,
                ],
                [
                    'kkm' => $item['kkm'] ?? $mapel->kkm_default,
                    'nilai' => $item['nilai'] ?? null,
                ]
            );

            LogEditNilai::updateOrCreate(
                ['siswa_id' => $item['siswa_id'], 'semester_id' => $semester->id],
                ['updated_by' => $user->id]
            );
        }

        return response()->json(['message' => 'Nilai akhir berhasil disimpan.']);
    }

    /**
     * Daftar siswa satu kelas + nilai akhir langsung mereka untuk satu mapel
     * (pendamping form input massal guru — untuk prefill nilai yang sudah ada).
     */
    public function daftarMassal(Request $request)
    {
        $data = $request->validate([
            'mapel_plus_id' => ['required', 'exists:mapel_plus,id'],
            'kelas_rombel_id' => ['required', 'exists:kelas_rombels,id'],
            'semester_id' => ['required', 'exists:semesters,id'],
        ]);

        $kelas = KelasRombel::findOrFail($data['kelas_rombel_id']);
        $semester = Semester::findOrFail($data['semester_id']);
        $this->pastikanBolehNilaiMassal($request->user(), (int) $data['mapel_plus_id'], $kelas, $semester);

        $nilaiMapel = NilaiMapel::where('mapel_plus_id', $data['mapel_plus_id'])
            ->where('semester_id', $semester->id)
            ->whereIn('siswa_id', Siswa::where('kelas_rombel_id', $kelas->id)->pluck('id'))
            ->get()
            ->keyBy('siswa_id');

        return Siswa::where('kelas_rombel_id', $kelas->id)
            ->orderBy('nama')
            ->get()
            ->map(fn (Siswa $s) => [
                'siswa_id' => $s->id,
                'nama' => $s->nama,
                'nis' => $s->nis,
                'nilai' => $nilaiMapel->get($s->id)?->nilai,
                'kkm' => $nilaiMapel->get($s->id)?->kkm,
            ]);
    }

    /* ── Helpers ──────────────────────────────────────────── */

    /** Scope input massal: guru harus mengampu mapel di kelas tsb; wali kelas kelasnya; admin bebas. */
    private function pastikanBolehNilaiMassal(User $user, int $mapelId, KelasRombel $kelas, Semester $semester): void
    {
        if ($user->hasRole('admin')) {
            return;
        }

        if ($user->hasRole('guru_pesantren')) {
            $boleh = GuruMapelKelas::where('guru_id', $user->guru?->id)
                ->where('mapel_plus_id', $mapelId)
                ->where('kelas_rombel_id', $kelas->id)
                ->where('semester_id', $semester->id)
                ->exists();
            abort_unless($boleh, 403, 'Anda tidak mengampu mata pelajaran ini di kelas tersebut.');

            return;
        }

        if ($user->hasRole('wali_kelas')) {
            abort_unless($kelas->wali_kelas_id === $user->id, 403, 'Anda bukan wali kelas kelas ini.');

            return;
        }

        abort(403);
    }

    /**
     * Export Excel daftar nilai satu kelas per semester (wali kelas & admin):
     * kolom NIS, nama, nilai efektif tiap mapel, total, rata-rata, dan ranking —
     * diurutkan dari ranking terbaik. Nilai efektif = nilai langsung atau
     * agregasi sumatif (sama dengan rapor).
     */
    public function export(Request $request)
    {
        $data = $request->validate([
            'semester_id' => ['required', 'exists:semesters,id'],
            'kelas_rombel_id' => ['nullable', 'exists:kelas_rombels,id'],
        ]);

        $user = $request->user();

        if ($user->hasRole('wali_kelas')) {
            $kelas = KelasRombel::where('wali_kelas_id', $user->id)->firstOrFail();
        } elseif ($user->hasRole('admin')) {
            abort_unless($data['kelas_rombel_id'] ?? null, 422, 'Parameter kelas_rombel_id wajib diisi.');
            $kelas = KelasRombel::findOrFail($data['kelas_rombel_id']);
        } else {
            abort(403, 'Hanya wali kelas dan admin yang dapat mengekspor daftar nilai.');
        }

        $semester = Semester::with('tahunAjaran')->findOrFail($data['semester_id']);
        $siswas = Siswa::where('kelas_rombel_id', $kelas->id)->orderBy('nama')->get();
        $mapels = MapelPlus::orderBy('urutan')->orderBy('kode')->get();

        $nilaiLangsung = NilaiMapel::where('semester_id', $semester->id)
            ->whereIn('siswa_id', $siswas->pluck('id'))
            ->get()
            ->groupBy('siswa_id')
            ->mapWithKeys(fn ($rows, $siswaId) => [$siswaId => $rows->pluck('nilai', 'mapel_plus_id')]);

        $agregat = Nilai::with('jenisAssessment')
            ->where('semester_id', $semester->id)
            ->whereIn('siswa_id', $siswas->pluck('id'))
            ->get()
            ->groupBy(fn ($n) => $n->siswa_id.'-'.$n->jenisAssessment->mapel_plus_id)
            ->mapWithKeys(function ($items, $key) {
                $sumatif = $items->filter(fn ($n) => $n->jenisAssessment->kategori === 'sumatif');
                $bobot = $sumatif->sum(fn ($n) => $n->jenisAssessment->bobot);
                $nilai = $bobot > 0
                    ? (int) round($sumatif->sum(fn ($n) => $n->nilai * $n->jenisAssessment->bobot) / $bobot)
                    : null;

                return [$key => $nilai];
            });

        // Baris per siswa: nilai tiap mapel (efektif), total, rata-rata
        $baris = $siswas->map(function (Siswa $siswa) use ($mapels, $nilaiLangsung, $agregat) {
            $nilaiPerMapel = $mapels->map(function (MapelPlus $mapel) use ($siswa, $nilaiLangsung, $agregat) {
                $langsung = $nilaiLangsung->get($siswa->id)?->get($mapel->id);
                $gabung = $agregat->get($siswa->id.'-'.$mapel->id);

                return $langsung ?? $gabung;
            });

            $total = (int) $nilaiPerMapel->filter()->sum();
            $rataRata = $mapels->count() > 0 ? round($total / $mapels->count(), 2) : 0;

            return [
                'siswa' => $siswa,
                'nilai' => $nilaiPerMapel,
                'total' => $total,
                'rata_rata' => $rataRata,
            ];
        });

        // Ranking berdasarkan total/rata-rata terbesar; nilai sama mendapat ranking sama
        $urutan = $baris->sortByDesc('total')->values();
        $ranking = collect();
        $rankSekarang = 0;
        $rankSebelumnya = null;
        foreach ($urutan as $i => $row) {
            $rankSekarang = $row['total'] === $rankSebelumnya ? $rankSekarang : $i + 1;
            $rankSebelumnya = $row['total'];
            $ranking[$row['siswa']->id] = $rankSekarang;
        }

        return $this->buatXlsx($kelas, $semester, $mapels, $urutan, $ranking);
    }

    private function buatXlsx($kelas, $semester, $mapels, $baris, $ranking)
    {
        $spreadsheet = new Spreadsheet;
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->setTitle(substr('Nilai '.$kelas->nama, 0, 31));

        $kolomAkhir = Coordinate::stringFromColumnIndex(4 + $mapels->count());
        $jumlahKolom = 4 + $mapels->count() + 3; // NIS, Nama, ...mapel, Total, Rata², Ranking + No

        // Judul
        $sheet->mergeCells("A1:{$kolomAkhir}1");
        $sheet->setCellValue('A1', 'DAFTAR NILAI KELAS '.$kelas->nama);
        $sheet->getStyle('A1')->getFont()->setBold(true)->setSize(14);
        $sheet->getStyle('A1')->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);

        $sheet->mergeCells("A2:{$kolomAkhir}2");
        $sheet->setCellValue('A2', "Semester {$semester->nama} · Tahun Ajaran {$semester->tahunAjaran->nama}");
        $sheet->getStyle('A2')->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);

        // Header tabel
        $header = ['No', 'NIS', 'Nama Siswa'];
        foreach ($mapels as $mapel) {
            $header[] = $mapel->nama;
        }
        array_push($header, 'Total', 'Rata-rata', 'Ranking');
        $sheet->fromArray($header, null, 'A4');

        $sheet->getStyle('A4:'.$kolomAkhir.'4')->getFont()->setBold(true);
        $sheet->getStyle('A4:'.$kolomAkhir.'4')->getFill()
            ->setFillType(Fill::FILL_SOLID)
            ->getStartColor()->setARGB('FFE7F3EF');
        $sheet->getStyle('A4:'.$kolomAkhir.'4')->getAlignment()
            ->setHorizontal(Alignment::HORIZONTAL_CENTER)
            ->setWrapText(true);

        // Data — sudah terurut ranking terbaik di atas
        $barisExcel = 5;
        foreach ($baris as $i => $row) {
            $sheet->setCellValue("A{$barisExcel}", $i + 1);
            $sheet->setCellValue("B{$barisExcel}", $row['siswa']->nis);
            $sheet->setCellValue("C{$barisExcel}", $row['siswa']->nama);

            $kolom = 4;
            foreach ($row['nilai'] as $nilai) {
                $sheet->setCellValue(Coordinate::stringFromColumnIndex($kolom).$barisExcel, $nilai);
                $kolom++;
            }

            $sheet->setCellValue(Coordinate::stringFromColumnIndex($kolom).$barisExcel, $row['total']);
            $sheet->setCellValue(Coordinate::stringFromColumnIndex($kolom + 1).$barisExcel, $row['rata_rata']);
            $sheet->setCellValue(Coordinate::stringFromColumnIndex($kolom + 2).$barisExcel, $ranking[$row['siswa']->id]);
            $barisExcel++;
        }

        // Border seluruh tabel
        $akhirData = max(5, $barisExcel - 1);
        $sheet->getStyle("A4:{$kolomAkhir}{$akhirData}")->getBorders()->applyFromArray([
            'allBorders' => ['borderStyle' => Border::BORDER_THIN, 'color' => ['argb' => 'FFCBD5E1']],
        ]);

        // Lebar kolom otomatis
        $sheet->getColumnDimension('A')->setWidth(5);
        $sheet->getColumnDimension('B')->setWidth(12);
        $sheet->getColumnDimension('C')->setWidth(28);
        for ($k = 4; $k <= 4 + $mapels->count() + 2; $k++) {
            $sheet->getColumnDimension(Coordinate::stringFromColumnIndex($k))->setWidth(12);
        }

        $sheet->freezePane('A5');

        $namaFile = sprintf(
            'Nilai_%s_Semester%s_%s.xlsx',
            str_replace(['/', '\\', '?', '*', '[', ']', ':'], '-', $kelas->nama),
            $semester->nama,
            str_replace('/', '-', $semester->tahunAjaran->nama),
        );

        $berkas = tempnam(sys_get_temp_dir(), 'sipp-export-');
        (new Xlsx($spreadsheet))->save($berkas);

        return response()->download($berkas, $namaFile, [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ])->deleteFileAfterSend(true);
    }

    private function userBolehLengkap(User $user, Siswa $siswa): bool
    {
        if ($user->hasRole('admin')) {
            return true;
        }

        return $user->hasRole('wali_kelas') && $siswa->kelasRombel?->wali_kelas_id === $user->id;
    }

    private function mapelBolehD(Request $request, Siswa $siswa, Semester $semester): Collection
    {
        $user = $request->user();

        if ($this->userBolehLengkap($user, $siswa)) {
            return MapelPlus::pluck('id');
        }

        if ($user->hasRole('guru_pesantren') && $user->guru && $siswa->kelas_rombel_id) {
            return GuruMapelKelas::where('guru_id', $user->guru->id)
                ->where('kelas_rombel_id', $siswa->kelas_rombel_id)
                ->where('semester_id', $semester->id)
                ->pluck('mapel_plus_id');
        }

        return collect();
    }

    private function praktikBolehD(User $user, Siswa $siswa, Semester $semester): Collection
    {
        if ($this->userBolehLengkap($user, $siswa)) {
            return PraktikItem::pluck('id');
        }

        if ($user->hasRole('guru_pesantren') && $user->guru) {
            return $user->guru->praktikItems()->pluck('praktik_items.id');
        }

        return collect();
    }

    private function mapelRekap(Siswa $siswa, Semester $semester, User $user): array
    {
        $mapels = MapelPlus::orderBy('urutan')->orderBy('kode')->get();
        $langsung = NilaiMapel::where('siswa_id', $siswa->id)->where('semester_id', $semester->id)->get()->keyBy('mapel_plus_id');
        $efektif = NilaiDiniyah::nilaiPerMapel($siswa->id, $semester->id);
        $mapelBoleh = $this->mapelBolehD(request(), $siswa, $semester);

        return $mapels->map(function (MapelPlus $mapel) use ($langsung, $efektif, $mapelBoleh) {
            $row = $langsung->get($mapel->id);
            $nilai = $efektif->get($mapel->id);

            return [
                'id' => $mapel->id,
                'kode' => $mapel->kode,
                'nama' => $mapel->nama,
                'nama_ar' => $mapel->nama_ar,
                'kelompok' => $mapel->kelompok,
                'kkm_default' => $mapel->kkm_default,
                'urutan' => $mapel->urutan,
                'nilai_mapel' => $row ? ['kkm' => $row->kkm, 'nilai' => $row->nilai] : null,
                'nilai_akhir' => $nilai,
                'predikat' => $nilai !== null ? PredikatRange::untukNilai($nilai)?->nama : null,
                'bisa_edit' => $mapelBoleh->contains($mapel->id),
            ];
        })->all();
    }

    private function praktikRekap(Siswa $siswa, Semester $semester, User $user): array
    {
        $items = PraktikItem::orderBy('urutan')->get();
        $terisi = NilaiPraktik::where('siswa_id', $siswa->id)->where('semester_id', $semester->id)->get()->keyBy('praktik_item_id');
        $praktikBoleh = $this->praktikBolehD($user, $siswa, $semester);

        return $items->map(function (PraktikItem $item) use ($terisi, $praktikBoleh) {
            $row = $terisi->get($item->id);

            return [
                'id' => $item->id,
                'kode' => $item->kode,
                'nama_id' => $item->nama_id,
                'nama_ar' => $item->nama_ar,
                'urutan' => $item->urutan,
                'nilai' => $row?->nilai,
                'keterangan' => $row?->keterangan,
                'bisa_edit' => $praktikBoleh->contains($item->id),
            ];
        })->all();
    }
}
