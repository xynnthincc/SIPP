<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Concerns\ScopesSiswaAccess;
use App\Http\Controllers\Controller;
use App\Models\GuruMapelKelas;
use App\Models\JenisAssessment;
use App\Models\Nilai;
use App\Models\PredikatRange;
use App\Models\Semester;
use App\Models\Siswa;
use Illuminate\Http\Request;

class NilaiController extends Controller
{
    use ScopesSiswaAccess;

    public function index(Request $request)
    {
        $user = $request->user();
        $siswaId = $request->siswa_id;

        if ($user->hasRole('siswa')) {
            $siswaId = $user->siswa?->id;
        } elseif ($siswaId) {
            $this->pastikanBolehLihatSiswa($request, (int) $siswaId);
        } elseif ($user->hasRole('orang_tua')) {
            abort(422, 'Parameter siswa_id wajib diisi untuk akun orang tua.');
        }

        return Nilai::with('siswa', 'jenisAssessment.mapelPlus')
            ->when($siswaId, fn ($q, $id) => $q->where('siswa_id', $id))
            ->when($request->semester_id, fn ($q, $id) => $q->where('semester_id', $id))
            ->get();
    }

    /**
     * Input nilai massal untuk satu jenis assessment (dipakai guru pesantren).
     * payload: { jenis_assessment_id, semester_id, nilai: [{siswa_id, nilai, catatan}] }
     */
    public function storeMassal(Request $request)
    {
        $data = $request->validate([
            'jenis_assessment_id' => ['required', 'exists:jenis_assessments,id'],
            'semester_id' => ['required', 'exists:semesters,id'],
            'nilai' => ['required', 'array', 'min:1'],
            'nilai.*.siswa_id' => ['required', 'exists:siswas,id'],
            'nilai.*.nilai' => ['required', 'numeric', 'min:0', 'max:100'],
            'nilai.*.catatan' => ['nullable', 'string'],
        ]);

        $semester = Semester::findOrFail($data['semester_id']);
        abort_unless($semester->penilaian_dibuka, 422, 'Periode penilaian semester ini sudah ditutup.');

        // Guru hanya boleh mencatat nilai pada mapel & kelas yang diampunya
        // di semester tersebut; admin bebas.
        $user = $request->user();
        if ($user->hasRole('guru_pesantren')) {
            $jenis = JenisAssessment::findOrFail($data['jenis_assessment_id']);
            $kelasDiampu = GuruMapelKelas::where('guru_id', $user->guru?->id)
                ->where('mapel_plus_id', $jenis->mapel_plus_id)
                ->where('semester_id', $semester->id)
                ->pluck('kelas_rombel_id');

            $kelasSiswa = Siswa::whereIn('id', collect($data['nilai'])->pluck('siswa_id'))
                ->pluck('kelas_rombel_id', 'id');

            foreach ($kelasSiswa as $siswaId => $kelasRombelId) {
                abort_unless(
                    $kelasDiampu->contains($kelasRombelId),
                    403,
                    'Anda tidak mengampu mata pelajaran ini untuk salah satu siswa tersebut.'
                );
            }
        }

        $hasil = collect($data['nilai'])->map(function ($item) use ($data, $request) {
            return Nilai::updateOrCreate(
                [
                    'siswa_id' => $item['siswa_id'],
                    'jenis_assessment_id' => $data['jenis_assessment_id'],
                    'semester_id' => $data['semester_id'],
                ],
                [
                    'nilai' => $item['nilai'],
                    'catatan' => $item['catatan'] ?? null,
                    'dicatat_oleh' => $request->user()->id,
                ]
            );
        });

        return response()->json($hasil);
    }

    /**
     * Rekap nilai akhir siswa per mapel dalam satu semester.
     * Nilai akhir = rata-rata tertimbang bobot assessment SUMATIF saja;
     * assessment FORMATIF tampil di rincian tapi dikecualikan dari perhitungan (pola e-rapor).
     * Nilai angka dikonversi otomatis ke predikat via rentang yang dikonfigurasi admin.
     */
    public function rekapSiswa(Request $request, $siswaId, $semesterId)
    {
        $this->pastikanBolehLihatSiswa($request, (int) $siswaId);

        $nilais = Nilai::with('jenisAssessment.mapelPlus')
            ->where('siswa_id', $siswaId)
            ->where('semester_id', $semesterId)
            ->get()
            ->groupBy(fn ($n) => $n->jenisAssessment->mapelPlus->id);

        $rekap = $nilais->map(function ($items) {
            $sumatif = $items->filter(fn ($n) => $n->jenisAssessment->kategori === 'sumatif');

            $totalBobot = $sumatif->sum(fn ($n) => $n->jenisAssessment->bobot);
            $nilaiTertimbang = $sumatif->sum(fn ($n) => $n->nilai * $n->jenisAssessment->bobot);
            $nilaiAkhir = $totalBobot > 0 ? round($nilaiTertimbang / $totalBobot, 2) : null;
            $predikat = $nilaiAkhir !== null ? PredikatRange::untukNilai($nilaiAkhir)?->nama : null;

            return [
                'mapel' => $items->first()->jenisAssessment->mapelPlus->nama,
                'nilai_akhir' => $nilaiAkhir,
                'predikat' => $predikat,
                'rincian' => $items->map(fn ($n) => [
                    'jenis' => $n->jenisAssessment->nama,
                    'kategori' => $n->jenisAssessment->kategori,
                    'nilai' => $n->nilai,
                    'bobot' => $n->jenisAssessment->bobot,
                ]),
            ];
        })->values();

        return response()->json($rekap);
    }
}
