<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Guru;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class GuruController extends Controller
{
    public function index()
    {
        return Guru::with('user', 'praktikItems')->get();
    }

    /** Buat akun user + profil guru sekaligus */
    public function store(Request $request)
    {
        $data = $request->validate([
            'nama' => ['required', 'string', 'max:100'],
            'email' => ['required', 'email', 'unique:users,email'],
            'password' => ['required', 'min:8'],
            'nip' => ['nullable', 'string', 'unique:gurus,nip'],
            'no_hp' => ['nullable', 'string'],
        ]);

        return DB::transaction(function () use ($data) {
            $user = User::create([
                'name' => $data['nama'],
                'email' => $data['email'],
                'password' => Hash::make($data['password']),
                'role' => User::ROLE_GURU_PESANTREN,
                'identifier' => $data['nip'] ?? null,
            ]);

            return Guru::create([
                'user_id' => $user->id,
                'nip' => $data['nip'] ?? null,
                'nama' => $data['nama'],
                'no_hp' => $data['no_hp'] ?? null,
            ]);
        });
    }

    public function update(Request $request, Guru $guru)
    {
        $data = $request->validate([
            'nama' => ['sometimes', 'string', 'max:100'],
            'no_hp' => ['nullable', 'string'],
            'is_aktif' => ['boolean'],
        ]);

        $guru->update($data);

        // Jaga nama akun login tetap sinkron dengan nama guru
        if (isset($data['nama'])) {
            $guru->user->update(['name' => $data['nama']]);
        }

        return $guru;
    }

    /** Hapus guru + akun loginnya. Diblokir jika masih ada data pengajaran/catatan. */
    public function destroy(Guru $guru)
    {
        if ($guru->guruMapelKelas()->exists()) {
            abort(422, 'Guru masih tercatat mengampu mapel/kelas. Hapus penugasan mengajarnya terlebih dahulu.');
        }

        if ($guru->catatanGurus()->exists()) {
            abort(422, 'Guru masih memiliki catatan terhadap siswa. Hapus catatan tersebut terlebih dahulu.');
        }

        $guru->delete();

        return response()->noContent();
    }

    /** Atur item praktik/hafalan yang diampu seorang guru (sync, admin). */
    public function simpanPraktik(Request $request, Guru $guru)
    {
        $data = $request->validate([
            'praktik_item_ids' => ['array'],
            'praktik_item_ids.*' => ['exists:praktik_items,id'],
        ], [
            'praktik_item_ids.*.exists' => 'Item praktik terpilih tidak valid.',
        ]);

        $guru->praktikItems()->sync($data['praktik_item_ids'] ?? []);

        return $guru->load('praktikItems');
    }
}
