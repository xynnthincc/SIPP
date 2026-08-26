<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\KelasRombel;
use Illuminate\Http\Request;

class KelasRombelController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        return KelasRombel::with('waliKelas', 'tahunAjaran')
            ->withCount('siswas')
            ->when($user->hasRole('wali_kelas'), fn ($q) => $q->where('wali_kelas_id', $user->id))
            ->get();
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'nama' => ['required', 'string', 'max:20'],
            'tingkat' => ['required', 'integer', 'min:7', 'max:9'],
            'wali_kelas_id' => ['nullable', 'exists:users,id'],
            'tahun_ajaran_id' => ['required', 'exists:tahun_ajarans,id'],
        ]);

        return KelasRombel::create($data);
    }

    public function update(Request $request, KelasRombel $kelasRombel)
    {
        $data = $request->validate([
            'nama' => ['sometimes', 'string', 'max:20'],
            'wali_kelas_id' => ['nullable', 'exists:users,id'],
        ]);

        $kelasRombel->update($data);

        return $kelasRombel;
    }

    public function destroy(KelasRombel $kelasRombel)
    {
        $kelasRombel->delete();

        return response()->noContent();
    }
}
