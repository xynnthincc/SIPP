<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Concerns\ScopesSiswaAccess;
use App\Http\Controllers\Controller;
use App\Models\DeskripsiCapaian;
use App\Models\Siswa;
use Illuminate\Http\Request;

class DeskripsiCapaianController extends Controller
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

        return DeskripsiCapaian::with('mapelPlus')
            ->when($siswaId, fn ($q, $id) => $q->where('siswa_id', $id))
            ->when($request->semester_id, fn ($q, $id) => $q->where('semester_id', $id))
            ->get();
    }

    /** Wali kelas menyimpan/memperbarui deskripsi capaian per mapel (upsert per semester) */
    public function store(Request $request)
    {
        $data = $request->validate([
            'siswa_id' => ['required', 'exists:siswas,id'],
            'mapel_plus_id' => ['required', 'exists:mapel_plus,id'],
            'semester_id' => ['required', 'exists:semesters,id'],
            'deskripsi' => ['required', 'string'],
        ]);

        $siswa = Siswa::findOrFail($data['siswa_id']);
        $this->pastikanWaliKelasSiswa($request, $siswa);

        return DeskripsiCapaian::updateOrCreate(
            [
                'siswa_id' => $data['siswa_id'],
                'mapel_plus_id' => $data['mapel_plus_id'],
                'semester_id' => $data['semester_id'],
            ],
            ['deskripsi' => $data['deskripsi']]
        );
    }
}
