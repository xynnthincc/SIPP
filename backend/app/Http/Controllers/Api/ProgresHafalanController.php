<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Concerns\ScopesSiswaAccess;
use App\Http\Controllers\Controller;
use App\Models\ProgresHafalan;
use Illuminate\Http\Request;

class ProgresHafalanController extends Controller
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

        return ProgresHafalan::with('mapelPlus', 'siswa.kelasRombel')
            ->when($siswaId, fn ($q, $id) => $q->where('siswa_id', $id))
            ->orderByDesc('tanggal_setoran')
            ->get();
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'siswa_id' => ['required', 'exists:siswas,id'],
            'mapel_plus_id' => ['required', 'exists:mapel_plus,id'],
            'tanggal_setoran' => ['required', 'date'],
            'materi' => ['required', 'string', 'max:150'],
            'status' => ['required', 'in:Lancar,Perlu Perbaikan,Mengulang'],
            'catatan' => ['nullable', 'string'],
        ]);

        $data['dicatat_oleh'] = $request->user()->id;

        return ProgresHafalan::create($data);
    }
}
