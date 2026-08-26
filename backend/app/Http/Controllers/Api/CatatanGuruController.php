<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Concerns\ScopesSiswaAccess;
use App\Http\Controllers\Controller;
use App\Models\CatatanGuru;
use Illuminate\Http\Request;

class CatatanGuruController extends Controller
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

        return CatatanGuru::with('guru')
            ->when($siswaId, fn ($q, $id) => $q->where('siswa_id', $id))
            ->orderByDesc('tanggal')
            ->get();
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'siswa_id' => ['required', 'exists:siswas,id'],
            'tanggal' => ['required', 'date'],
            'catatan' => ['required', 'string'],
        ]);

        $guru = $request->user()->guru;
        abort_unless($guru, 403, 'Hanya guru pesantren yang dapat menambahkan catatan.');

        $data['guru_id'] = $guru->id;

        return CatatanGuru::create($data);
    }
}
