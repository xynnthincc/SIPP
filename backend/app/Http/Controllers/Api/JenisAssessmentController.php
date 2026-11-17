<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\JenisAssessment;
use Illuminate\Http\Request;

class JenisAssessmentController extends Controller
{
    public function index(Request $request)
    {
        return JenisAssessment::when($request->mapel_plus_id, fn ($q, $id) => $q->where('mapel_plus_id', $id))->get();
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'mapel_plus_id' => ['required', 'exists:mapel_plus,id'],
            'nama' => ['required', 'string', 'max:100'],
            'kategori' => ['nullable', 'in:formatif,sumatif'],
            'bobot' => ['required', 'numeric', 'min:0', 'max:100'],
        ]);

        // Bobot hanya berpengaruh untuk assessment sumatif; formatif selalu dikecualikan dari nilai akhir
        return JenisAssessment::create([
            ...$data,
            'kategori' => $data['kategori'] ?? 'sumatif',
        ]);
    }

    public function update(Request $request, JenisAssessment $jenisAssessment)
    {
        $data = $request->validate([
            'nama' => ['sometimes', 'string', 'max:100'],
            'kategori' => ['nullable', 'in:formatif,sumatif'],
            'bobot' => ['sometimes', 'numeric', 'min:0', 'max:100'],
        ]);

        $jenisAssessment->update($data);

        return $jenisAssessment;
    }

    public function destroy(JenisAssessment $jenisAssessment)
    {
        if ($jenisAssessment->nilais()->exists()) {
            abort(422, 'Jenis assessment ini sudah dipakai untuk nilai siswa. Tidak bisa dihapus.');
        }

        $jenisAssessment->delete();

        return response()->noContent();
    }
}
