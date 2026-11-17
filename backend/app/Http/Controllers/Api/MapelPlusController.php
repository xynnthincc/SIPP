<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\MapelPlus;
use App\Models\Nilai;
use Illuminate\Http\Request;

class MapelPlusController extends Controller
{
    public function index()
    {
        return MapelPlus::withCount('jenisAssessments')->orderBy('urutan')->get();
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'kode' => ['required', 'string', 'unique:mapel_plus,kode'],
            'nama' => ['required', 'string', 'max:100'],
            'nama_ar' => ['nullable', 'string', 'max:100'],
            'kelompok' => ['nullable', 'in:tahfidz,tahsin,kitab_kuning,bahasa_arab,akhlak'],
            'kkm_default' => ['nullable', 'integer', 'between:1,100'],
            'urutan' => ['nullable', 'integer', 'min:0'],
            'deskripsi' => ['nullable', 'string'],
            'punya_progres_hafalan' => ['boolean'],
        ]);

        return MapelPlus::create($data);
    }

    public function update(Request $request, MapelPlus $mapelPlus)
    {
        $data = $request->validate([
            'nama' => ['sometimes', 'string', 'max:100'],
            'nama_ar' => ['nullable', 'string', 'max:100'],
            'kelompok' => ['nullable', 'in:tahfidz,tahsin,kitab_kuning,bahasa_arab,akhlak'],
            'kkm_default' => ['nullable', 'integer', 'between:1,100'],
            'urutan' => ['nullable', 'integer', 'min:0'],
            'deskripsi' => ['nullable', 'string'],
            'punya_progres_hafalan' => ['boolean'],
        ]);

        $mapelPlus->update($data);

        return $mapelPlus;
    }

    /** Hapus mapel + jenis assessment-nya. Diblokir jika sudah ada nilai/hafalan/pengajaran. */
    public function destroy(MapelPlus $mapelPlus)
    {
        $punyaNilai = Nilai::whereHas('jenisAssessment', fn ($q) => $q->where('mapel_plus_id', $mapelPlus->id))->exists();

        if ($punyaNilai) {
            abort(422, 'Mapel ini masih memiliki data nilai siswa. Tidak bisa dihapus.');
        }

        if ($mapelPlus->progresHafalans()->exists()) {
            abort(422, 'Mapel ini masih memiliki data progres hafalan. Tidak bisa dihapus.');
        }

        if ($mapelPlus->guruMapelKelas()->exists()) {
            abort(422, 'Mapel ini masih tercatat di penugasan guru. Hapus penugasannya terlebih dahulu.');
        }

        if ($mapelPlus->nilaiMapels()->exists()) {
            abort(422, 'Mapel ini masih memiliki data nilai diniyah siswa. Tidak bisa dihapus.');
        }

        $mapelPlus->delete();

        return response()->noContent();
    }
}
