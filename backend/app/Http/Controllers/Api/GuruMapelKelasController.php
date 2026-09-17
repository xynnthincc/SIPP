<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\GuruMapelKelas;
use Illuminate\Http\Request;

class GuruMapelKelasController extends Controller
{
    public function index(Request $request)
    {
        return GuruMapelKelas::with('guru.user', 'mapelPlus', 'kelasRombel', 'semester')
            ->when($request->guru_id, fn ($q, $id) => $q->where('guru_id', $id))
            ->when($request->semester_id, fn ($q, $id) => $q->where('semester_id', $id))
            ->get();
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'guru_id' => ['required', 'exists:gurus,id'],
            'mapel_plus_id' => ['required', 'exists:mapel_plus,id'],
            'kelas_rombel_id' => ['required', 'exists:kelas_rombels,id'],
            'semester_id' => ['required', 'exists:semesters,id'],
        ]);

        return GuruMapelKelas::create($data);
    }

    public function update(Request $request, GuruMapelKelas $guruMapelKelas)
    {
        $data = $request->validate([
            'guru_id' => ['required', 'exists:gurus,id'],
            'mapel_plus_id' => ['required', 'exists:mapel_plus,id'],
            'kelas_rombel_id' => ['required', 'exists:kelas_rombels,id'],
            'semester_id' => ['required', 'exists:semesters,id'],
        ]);

        $guruMapelKelas->update($data);

        return $guruMapelKelas;
    }

    public function destroy(GuruMapelKelas $guruMapelKelas)
    {
        $guruMapelKelas->delete();

        return response()->noContent();
    }
}
