<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\DeskripsiCapaian;
use App\Models\GuruMapelKelas;
use App\Models\Nilai;
use App\Models\Semester;
use Illuminate\Http\Request;

class SemesterController extends Controller
{
    public function index(Request $request)
    {
        return Semester::with('tahunAjaran')
            ->when($request->tahun_ajaran_id, fn ($q, $id) => $q->where('tahun_ajaran_id', $id))
            ->get();
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'tahun_ajaran_id' => ['required', 'exists:tahun_ajarans,id'],
            'nama' => ['required', 'in:Ganjil,Genap'],
            'is_aktif' => ['boolean'],
            'penilaian_dibuka' => ['boolean'],
        ]);

        $sudahAda = Semester::where('tahun_ajaran_id', $data['tahun_ajaran_id'])
            ->where('nama', $data['nama'])
            ->exists();
        abort_if($sudahAda, 422, "Semester {$data['nama']} untuk tahun ajaran ini sudah ada.");

        return Semester::create($data);
    }

    public function update(Request $request, Semester $semester)
    {
        $data = $request->validate([
            'is_aktif' => ['boolean'],
            'penilaian_dibuka' => ['boolean'],
        ]);

        $semester->update($data);

        return $semester;
    }

    public function destroy(Semester $semester)
    {
        $dipakai = collect([
            Nilai::where('semester_id', $semester->id)->exists(),
            DeskripsiCapaian::where('semester_id', $semester->id)->exists(),
            GuruMapelKelas::where('semester_id', $semester->id)->exists(),
        ])->contains(true);

        if ($dipakai) {
            abort(422, 'Semester ini masih memiliki data nilai/penugasan. Tidak bisa dihapus.');
        }

        $semester->delete();

        return response()->noContent();
    }
}
