<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Concerns\ScopesSiswaAccess;
use App\Http\Controllers\Controller;
use App\Models\Siswa;
use Illuminate\Http\Request;

class SiswaController extends Controller
{
    use ScopesSiswaAccess;

    public function index(Request $request)
    {
        $user = $request->user();

        if ($user->hasRole('siswa')) {
            return Siswa::with('kelasRombel', 'wali')->where('id', $user->siswa?->id)->get();
        }

        if ($user->hasRole('orang_tua')) {
            $idAnak = $user->anakWali()->pluck('siswas.id');

            return Siswa::with('kelasRombel', 'wali')->whereIn('id', $idAnak)->get();
        }

        if ($user->hasRole('guru_pesantren')) {
            // Guru hanya boleh melihat siswa pada kelas yang diampunya.
            $kelasDiampu = $user->guru?->guruMapelKelas()->distinct()->pluck('kelas_rombel_id') ?? collect();
            $kelasId = $kelasDiampu->isNotEmpty() ? $kelasDiampu->all() : [-1];

            return Siswa::with('kelasRombel', 'wali')
                ->whereIn('kelas_rombel_id', $kelasId)
                ->when($request->kelas_rombel_id, fn ($q, $id) => $q->where('kelas_rombel_id', $id))
                ->when($request->search, fn ($q, $s) => $q->where('nama', 'like', "%{$s}%")->orWhere('nis', 'like', "%{$s}%"))
                ->paginate(20);
        }

        return Siswa::with('kelasRombel', 'wali')
            ->when($request->kelas_rombel_id, fn ($q, $id) => $q->where('kelas_rombel_id', $id))
            ->when($request->search, fn ($q, $s) => $q->where('nama', 'like', "%{$s}%")->orWhere('nis', 'like', "%{$s}%"))
            ->paginate(20);
    }

    public function show(Request $request, Siswa $siswa)
    {
        $this->pastikanBolehLihatSiswa($request, $siswa->id);

        return $siswa->load('kelasRombel', 'wali', 'user');
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'nis' => ['required', 'string', 'unique:siswas,nis'],
            'nama' => ['required', 'string', 'max:100'],
            'kelas_rombel_id' => ['nullable', 'exists:kelas_rombels,id'],
            'jenis_kelamin' => ['required', 'in:L,P'],
            'tempat_lahir' => ['nullable', 'string'],
            'tanggal_lahir' => ['nullable', 'date'],
            'agama' => ['nullable', 'string', 'max:30'],
            'alamat' => ['nullable', 'string'],
            'sekolah_asal' => ['nullable', 'string', 'max:100'],
            'nama_ayah' => ['nullable', 'string', 'max:100'],
            'nama_ibu' => ['nullable', 'string', 'max:100'],
            'no_wa_ayah' => ['nullable', 'string', 'max:20'],
            'profesi_ayah' => ['nullable', 'string', 'max:100'],
            'profesi_ibu' => ['nullable', 'string', 'max:100'],
            'status_anak' => ['nullable', 'string', 'max:20'],
            'anak_ke' => ['nullable', 'string', 'max:10'],
            'no_telp' => ['nullable', 'string', 'max:20'],
            'foto' => ['nullable', 'string', 'max:255'],
            'diterima_kelas' => ['nullable', 'string', 'max:20'],
            'diterima_tanggal' => ['nullable', 'date'],
            'no_telp_ibu' => ['nullable', 'string', 'max:20'],
            'alamat_ortu' => ['nullable', 'string'],
            'nama_wali' => ['nullable', 'string', 'max:100'],
            'pekerjaan_wali' => ['nullable', 'string', 'max:100'],
            'alamat_wali' => ['nullable', 'string'],
            'no_telp_wali' => ['nullable', 'string', 'max:20'],
            'is_aktif' => ['boolean'],
        ]);

        return Siswa::create($data);
    }

    public function update(Request $request, Siswa $siswa)
    {
        $data = $request->validate([
            'nis' => ['sometimes', 'string', 'unique:siswas,nis,'.$siswa->id],
            'nama' => ['sometimes', 'string', 'max:100'],
            'kelas_rombel_id' => ['nullable', 'exists:kelas_rombels,id'],
            'tempat_lahir' => ['nullable', 'string'],
            'tanggal_lahir' => ['nullable', 'date'],
            'agama' => ['nullable', 'string', 'max:30'],
            'alamat' => ['nullable', 'string'],
            'no_telp' => ['nullable', 'string', 'max:20'],
            'foto' => ['nullable', 'string', 'max:255'],
            'sekolah_asal' => ['nullable', 'string', 'max:100'],
            'diterima_kelas' => ['nullable', 'string', 'max:20'],
            'diterima_tanggal' => ['nullable', 'date'],
            'nama_ayah' => ['nullable', 'string', 'max:100'],
            'nama_ibu' => ['nullable', 'string', 'max:100'],
            'no_wa_ayah' => ['nullable', 'string', 'max:20'],
            'profesi_ayah' => ['nullable', 'string', 'max:100'],
            'profesi_ibu' => ['nullable', 'string', 'max:100'],
            'status_anak' => ['nullable', 'string', 'max:20'],
            'anak_ke' => ['nullable', 'string', 'max:10'],
            'no_telp_ibu' => ['nullable', 'string', 'max:20'],
            'alamat_ortu' => ['nullable', 'string'],
            'nama_wali' => ['nullable', 'string', 'max:100'],
            'pekerjaan_wali' => ['nullable', 'string', 'max:100'],
            'alamat_wali' => ['nullable', 'string'],
            'no_telp_wali' => ['nullable', 'string', 'max:20'],
            'is_aktif' => ['boolean'],
        ]);

        $siswa->update($data);

        return $siswa;
    }

    public function destroy(Siswa $siswa)
    {
        $siswa->delete();

        return response()->noContent();
    }

    /** Hubungkan siswa dengan akun orang tua/wali */
    public function tambahWali(Request $request, Siswa $siswa)
    {
        $data = $request->validate([
            'user_id' => ['required', 'exists:users,id'],
            'hubungan' => ['nullable', 'string', 'max:30'],
        ]);

        $siswa->wali()->syncWithoutDetaching([$data['user_id'] => ['hubungan' => $data['hubungan'] ?? null]]);

        return $siswa->load('wali');
    }
}
