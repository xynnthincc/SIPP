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
        return Guru::with('user')->get();
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

        return $guru;
    }
}
