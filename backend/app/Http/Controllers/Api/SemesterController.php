<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
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
}
