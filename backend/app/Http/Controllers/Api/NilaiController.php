<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Concerns\ScopesSiswaAccess;
use App\Http\Controllers\Controller;
use App\Models\JenisAssessment;
use App\Models\Nilai;
use App\Models\Semester;
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

    /** Rekap nilai akhir siswa per mapel dalam satu semester (nilai rata-rata tertimbang bobot) */
    public function rekapSiswa(Request $request, $siswaId, $semesterId)
    {
        $this->pastikanBolehLihatSiswa($request, (int) $siswaId);

        $nilais = Nilai::with('jenisAssessment.mapelPlus')
            ->where('siswa_id', $siswaId)
            ->where('semester_id', $semesterId)
            ->get()
            ->groupBy(fn ($n) => $n->jenisAssessment->mapelPlus->id);

        $rekap = $nilais->map(function ($items) {
            $totalBobot = $items->sum(fn ($n) => $n->jenisAssessment->bobot);
            $nilaiTertimbang = $items->sum(fn ($n) => $n->nilai * $n->jenisAssessment->bobot);

            return [
                'mapel' => $items->first()->jenisAssessment->mapelPlus->nama,
                'nilai_akhir' => $totalBobot > 0 ? round($nilaiTertimbang / $totalBobot, 2) : null,
                'rincian' => $items->map(fn ($n) => [
                    'jenis' => $n->jenisAssessment->nama,
                    'nilai' => $n->nilai,
                    'bobot' => $n->jenisAssessment->bobot,
                ]),
            ];
        })->values();

        return response()->json($rekap);
    }
}
