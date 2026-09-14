<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Rapor;
use App\Models\TahunAjaran;
use Illuminate\Http\Request;

class TahunAjaranController extends Controller
{
    public function index()
    {
        return TahunAjaran::with('semesters')->latest()->get();
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'nama' => ['required', 'string', 'max:20'],
            'is_aktif' => ['boolean'],
        ]);

        return TahunAjaran::create($data);
    }

    public function update(Request $request, TahunAjaran $tahunAjaran)
    {
        $data = $request->validate([
            'nama' => ['sometimes', 'string', 'max:20'],
            'is_aktif' => ['boolean'],
        ]);

        $tahunAjaran->update($data);

        return $tahunAjaran;
    }

    public function destroy(TahunAjaran $tahunAjaran)
    {
        $jumlahKelas = $tahunAjaran->kelasRombels()->count();
        if ($jumlahKelas > 0) {
            abort(422, "Tahun ajaran ini masih memiliki {$jumlahKelas} kelas. Hapus kelasnya terlebih dahulu.");
        }

        if (Rapor::whereIn('semester_id', $tahunAjaran->semesters()->pluck('id'))->exists()) {
            abort(422, 'Tahun ajaran ini masih memiliki data rapor. Tidak bisa dihapus.');
        }

        $tahunAjaran->delete();

        return response()->noContent();
    }
}
