<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\KehadiranRekap;
use App\Models\MapelPlus;
use App\Models\NilaiMapel;
use App\Models\NilaiPraktik;
use App\Models\Pembiasaan;
use App\Models\PraktikItem;
use App\Models\Sekolah;
use App\Models\Semester;
use App\Models\Sikap;
use App\Models\Siswa;
use App\Support\ArabBilangan;
use App\Support\NilaiDiniyah;
use Illuminate\Http\Request;
use Spatie\Browsershot\Browsershot;

class RaporController extends Controller
{
    /**
     * Komposisi data rapor bilingual (Arab & Latin) untuk halaman cetak.
     * Mengikuti alur e-rapor lama: rapor adalah CETAKAN REAL-TIME dari data
     * nilai — tanpa status/validasi, boleh dicetak kapan pun oleh yang berhak.
     */
    public function cetak(Request $request)
    {
        $data = $request->validate([
            'siswa_id' => ['required', 'exists:siswas,id'],
            'semester_id' => ['nullable', 'exists:semesters,id'],
        ]);

        $siswa = Siswa::with('kelasRombel')->findOrFail($data['siswa_id']);
        $semester = isset($data['semester_id'])
            ? Semester::findOrFail($data['semester_id'])
            : Semester::where('is_aktif', true)->firstOrFail();

        $this->pastikanBolehCetak($request, $siswa);

        return response()->json($this->komposisiCetak($siswa, $semester));
    }

    /**
     * Rapor sebagai dokumen (untuk share dari aplikasi).
     * Driver `html` (default) mengembalikan HTML siap render/print;
     * driver `chrome` menghasilkan PDF sungguhan via Browsershot (node+puppeteer).
     */
    public function pdf(Request $request)
    {
        $data = $request->validate([
            'siswa_id' => ['required', 'exists:siswas,id'],
            'semester_id' => ['nullable', 'exists:semesters,id'],
        ]);

        $siswa = Siswa::with('kelasRombel')->findOrFail($data['siswa_id']);
        $semester = isset($data['semester_id'])
            ? Semester::findOrFail($data['semester_id'])
            : Semester::where('is_aktif', true)->firstOrFail();

        $this->pastikanBolehCetak($request, $siswa);

        $html = view('pdf.rapor', ['rapor' => $this->komposisiCetak($siswa, $semester)])->render();

        $driver = config('services.rapor.pdf_driver', 'html');
        if ($driver === 'chrome' && class_exists(Browsershot::class)) {
            try {
                $pdf = Browsershot::html($html)
                    ->format('A4')
                    ->margins(14, 10, 14, 10)
                    ->showOutline()
                    ->pdf();

                return response($pdf)->header('Content-Type', 'application/pdf');
            } catch (\Throwable $e) {
                report($e);
            }
        }

        return response($html)->header('Content-Type', 'text/html; charset=UTF-8');
    }

    /**
     * Progres kelengkapan nilai per siswa — indikator kesiapan rapor
     * (ala halaman "pilih santri" e-rapor lama). Tanpa menjadi gerbang cetak.
     * Akses: admin & kepala sekolah (semua kelas), wali kelas (hanya kelasnya).
     */
    public function progres(Request $request)
    {
        $data = $request->validate([
            'semester_id' => ['required', 'exists:semesters,id'],
            'kelas_rombel_id' => ['nullable', 'exists:kelas_rombels,id'],
        ]);

        $user = $request->user();
        abort_unless($user->hasRole('admin', 'kepala_sekolah', 'wali_kelas'), 403);

        $semester = Semester::findOrFail($data['semester_id']);

        $siswaQuery = Siswa::with('kelasRombel')->orderBy('nama');
        if ($user->hasRole('wali_kelas')) {
            $siswaQuery->whereHas('kelasRombel', fn ($q) => $q->where('wali_kelas_id', $user->id));
        }
        if (! empty($data['kelas_rombel_id'])) {
            $siswaQuery->where('kelas_rombel_id', $data['kelas_rombel_id']);
        }

        $totalMapel = MapelPlus::count();
        $totalPraktik = PraktikItem::count();

        $hasil = $siswaQuery->get()->map(function (Siswa $siswa) use ($semester, $totalMapel, $totalPraktik) {
            $mapelTerisi = NilaiDiniyah::nilaiPerMapel($siswa->id, $semester->id)->filter()->count();
            $praktikTerisi = NilaiPraktik::where('siswa_id', $siswa->id)
                ->where('semester_id', $semester->id)
                ->whereNotNull('nilai')
                ->count();
            $pembiasaan = Pembiasaan::where('siswa_id', $siswa->id)->where('semester_id', $semester->id)->whereNotNull('nilai')->exists();
            $sikap = Sikap::where('siswa_id', $siswa->id)->where('semester_id', $semester->id)
                ->where(fn ($q) => $q->whereNotNull('akhlaq')->orWhereNotNull('kepribadian'))
                ->exists();
            $kehadiran = KehadiranRekap::where('siswa_id', $siswa->id)->where('semester_id', $semester->id)->exists();

            return [
                'siswa' => [
                    'id' => $siswa->id,
                    'nama' => $siswa->nama,
                    'nis' => $siswa->nis,
                ],
                'kelas' => $siswa->kelasRombel?->nama,
                'mapel_terisi' => $mapelTerisi,
                'mapel_total' => $totalMapel,
                'praktik_terisi' => $praktikTerisi,
                'praktik_total' => $totalPraktik,
                'pembiasaan_terisi' => $pembiasaan,
                'sikap_terisi' => $sikap,
                'kehadiran_terisi' => $kehadiran,
                'lengkap' => $totalMapel > 0 && $mapelTerisi === $totalMapel && $praktikTerisi === $totalPraktik,
            ];
        })->values();

        return response()->json($hasil);
    }

    /** Guru pesantren tidak boleh mencetak; wali kelas terbatas kelasnya; siswa/ortu miliknya sendiri */
    private function pastikanBolehCetak(Request $request, Siswa $siswa): void
    {
        $user = $request->user();

        $boleh = $user->hasRole('admin', 'kepala_sekolah')
            || ($user->hasRole('wali_kelas') && $siswa->kelasRombel?->wali_kelas_id === $user->id)
            || ($user->hasRole('siswa') && $siswa->user_id === $user->id)
            || ($user->hasRole('orang_tua') && $siswa->anakWali()->where('users.id', $user->id)->exists());

        abort_unless($boleh, 403, 'Anda tidak berhak mencetak rapor ini.');
    }

    private function komposisiCetak(Siswa $siswa, Semester $semester): array
    {
        $kelas = $siswa->kelasRombel;

        $mapel = $this->dataMapel($siswa->id, $semester->id);
        $total = 0;
        $jumlahMapelTerisi = 0;
        foreach ($mapel as &$row) {
            if ($row['nilai'] !== null) {
                $total += (int) $row['nilai'];
                $jumlahMapelTerisi++;
            }
        }
        unset($row);
        $rata2 = $jumlahMapelTerisi > 0 ? round($total / $jumlahMapelTerisi, 2) : 0;
        $peringkat = $this->hitungPeringkat($siswa->kelas_rombel_id, $semester->id, $siswa->id);

        $praktik = PraktikItem::orderBy('urutan')->get()
            ->map(fn (PraktikItem $item) => [
                'kode' => $item->kode,
                'nama_id' => $item->nama_id,
                'nama_ar' => $item->nama_ar,
                'nilai' => NilaiPraktik::where('siswa_id', $siswa->id)->where('semester_id', $semester->id)->where('praktik_item_id', $item->id)->value('nilai'),
                'keterangan' => NilaiPraktik::where('siswa_id', $siswa->id)->where('semester_id', $semester->id)->where('praktik_item_id', $item->id)->value('keterangan'),
            ])->all();

        $pembiasaan = Pembiasaan::where('siswa_id', $siswa->id)->where('semester_id', $semester->id)->value('nilai');
        $sikap = Sikap::where('siswa_id', $siswa->id)->where('semester_id', $semester->id)->first();
        $kehadiran = KehadiranRekap::where('siswa_id', $siswa->id)->where('semester_id', $semester->id)->first();

        $waliNama = $kelas?->waliKelas?->name;

        return [
            'sekolah' => Sekolah::profil(),
            'siswa' => [
                'id' => $siswa->id,
                'nama' => $siswa->nama,
                'nis' => $siswa->nis,
            ],
            'kelas' => $kelas ? ['nama' => $kelas->nama, 'tingkat' => $kelas->tingkat] : null,
            'wali_kelas' => $waliNama,
            'semester' => [
                'id' => $semester->id,
                'nama' => $semester->nama,
                'jenis' => $semester->jenis,
                'tahun' => $semester->tahunAjaran->nama,
                'tempat_tanggal_rapot' => $semester->tempat_tanggal_rapot,
            ],
            'mapel' => $mapel,
            'total' => $total,
            'rata2' => $rata2,
            'rata2_bulat' => (int) round($rata2),
            'peringkat' => $peringkat,
            'predikat' => $peringkat ? ArabBilangan::predikatByRank($peringkat) : null,
            'praktik' => $praktik,
            'pembiasaan' => $pembiasaan,
            'sikap' => $sikap ? ['akhlaq' => $sikap->akhlaq, 'kepribadian' => $sikap->kepribadian] : null,
            'kehadiran' => $kehadiran ? ['sakit' => $kehadiran->sakit, 'izin' => $kehadiran->izin, 'alpa' => $kehadiran->alpa] : null,
        ];
    }

    private function dataMapel(int $siswaId, int $semesterId): array
    {
        $efektif = NilaiDiniyah::nilaiPerMapel($siswaId, $semesterId);
        $directKkm = NilaiMapel::where('siswa_id', $siswaId)->where('semester_id', $semesterId)->pluck('kkm', 'mapel_plus_id');

        return MapelPlus::orderBy('urutan')->orderBy('kode')->get()
            ->map(function (MapelPlus $mapel) use ($efektif, $directKkm) {
                $nilai = $efektif->get($mapel->id);
                $kkm = $nilai !== null ? ($directKkm->get($mapel->id) ?? $mapel->kkm_default) : null;

                return [
                    'nama_id' => $mapel->nama,
                    'nama_ar' => $mapel->nama_ar,
                    'kkm' => $kkm,
                    'nilai' => $nilai,
                    'angka_arab' => $nilai !== null ? ArabBilangan::angkaArab($nilai) : null,
                    'terbilang' => $nilai !== null ? ArabBilangan::terbilangArab((int) $nilai) : null,
                    'ket_nilai' => $nilai !== null ? ArabBilangan::ketNilai((int) $nilai) : null,
                ];
            })->all();
    }

    private function hitungPeringkat(int $kelasId, int $semesterId, int $siswaId): ?int
    {
        $siswaDiKelas = Siswa::where('kelas_rombel_id', $kelasId)->pluck('id');
        if ($siswaDiKelas->isEmpty()) {
            return null;
        }

        $nilaiPef = [];
        foreach ($siswaDiKelas as $id) {
            $daftar = NilaiDiniyah::nilaiPerMapel($id, $semesterId)->filter(fn ($v) => $v !== null)->values();

            if ($daftar->isEmpty()) {
                continue;
            }

            $nilaiPef[$id] = $daftar->avg();
        }

        $diurut = collect($nilaiPef)->sortDesc();
        $peringkat = 1;
        foreach ($diurut as $id => $avg) {
            if ((int) $id === $siswaId) {
                return $peringkat;
            }
            $peringkat++;
        }

        return null;
    }
}
