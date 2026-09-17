<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\DeskripsiCapaian;
use App\Models\GuruMapelKelas;
use App\Models\Nilai;
use App\Models\Semester;
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

        $tahunAjaran = TahunAjaran::create($data);

        // Tahun ajaran baru otomatis dibekali semester Ganjil & Genap
        // (sesuai janji form admin); statusnya menyusul diaktifkan admin.
        foreach (['Ganjil', 'Genap'] as $nama) {
            Semester::firstOrCreate(
                ['tahun_ajaran_id' => $tahunAjaran->id, 'nama' => $nama],
                ['is_aktif' => false, 'penilaian_dibuka' => false]
            );
        }

        return $tahunAjaran->load('semesters');
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

        $semesterIds = $tahunAjaran->semesters()->pluck('id');
        $adaData = Nilai::whereIn('semester_id', $semesterIds)->exists()
            || DeskripsiCapaian::whereIn('semester_id', $semesterIds)->exists()
            || GuruMapelKelas::whereIn('semester_id', $semesterIds)->exists();
        if ($adaData) {
            abort(422, 'Tahun ajaran ini masih memiliki data nilai/penugasan. Tidak bisa dihapus.');
        }

        $tahunAjaran->delete();

        return response()->noContent();
    }
}
