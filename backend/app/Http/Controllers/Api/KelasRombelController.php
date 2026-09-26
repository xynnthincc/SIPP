<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\KelasRombel;
use App\Models\SiswaKelas;
use App\Models\User;
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

        $kelas = KelasRombel::create($data);
        $this->sinkronRoleWali($data['wali_kelas_id'] ?? null);

        return $kelas;
    }

    public function update(Request $request, KelasRombel $kelasRombel)
    {
        $data = $request->validate([
            'nama' => ['sometimes', 'string', 'max:20'],
            'tingkat' => ['sometimes', 'integer', 'min:7', 'max:9'],
            'wali_kelas_id' => ['nullable', 'exists:users,id'],
        ]);

        $waliLama = $kelasRombel->wali_kelas_id;
        $kelasRombel->update($data);

        // Sinkron role bila penunjukan wali kelas berubah
        if (array_key_exists('wali_kelas_id', $data) && $data['wali_kelas_id'] !== $waliLama) {
            $this->sinkronRoleWali($waliLama);
            $this->sinkronRoleWali($data['wali_kelas_id']);
        }

        return $kelasRombel;
    }

    public function destroy(KelasRombel $kelasRombel)
    {
        $jumlahSiswa = $kelasRombel->siswas()->count();
        $jumlahRiwayat = SiswaKelas::where('kelas_rombel_id', $kelasRombel->id)->count();
        if ($jumlahSiswa > 0 || $jumlahRiwayat > 0) {
            abort(422, "Kelas ini masih memiliki {$jumlahRiwayat} siswa (termasuk riwayat penempatan). Pindahkan siswa ke kelas lain terlebih dahulu.");
        }

        if ($kelasRombel->guruMapelKelas()->exists()) {
            abort(422, 'Kelas ini masih tercatat di penugasan guru. Hapus penugasannya terlebih dahulu.');
        }

        $wali = $kelasRombel->wali_kelas_id;
        $kelasRombel->delete();
        $this->sinkronRoleWali($wali);

        return response()->noContent();
    }

    /**
     * Jaga konsistensi role: user yang ditunjuk wali kelas mendapat role
     * wali_kelas; wali lama yang sudah tidak mengwalikan kelas mana pun
     * dikembalikan ke guru_pesantren. Role selain keduanya tidak disentuh.
     */
    private function sinkronRoleWali(?int $userId): void
    {
        if ($userId === null) {
            return;
        }

        $user = User::find($userId);
        if (! $user || ! $user->guru) {
            return;
        }

        if (KelasRombel::where('wali_kelas_id', $user->id)->exists()) {
            if ($user->role === User::ROLE_GURU_PESANTREN) {
                $user->update(['role' => User::ROLE_WALI_KELAS]);
            }
        } elseif ($user->role === User::ROLE_WALI_KELAS) {
            $user->update(['role' => User::ROLE_GURU_PESANTREN]);
        }
    }
}
