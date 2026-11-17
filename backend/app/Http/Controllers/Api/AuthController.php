<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $credentials = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required'],
        ]);

        if (! Auth::attempt($credentials)) {
            throw ValidationException::withMessages([
                'email' => ['Email atau password salah.'],
            ]);
        }

        /** @var User $user */
        $user = Auth::user();

        if (! $user->is_active) {
            Auth::logout();
            throw ValidationException::withMessages([
                'email' => ['Akun Anda dinonaktifkan. Hubungi admin sekolah.'],
            ]);
        }

        $token = $user->createToken('sipp-token')->plainTextToken;

        return response()->json([
            'user' => $this->userDenganFlag($user),
            'token' => $token,
        ]);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Berhasil logout.']);
    }

    public function me(Request $request)
    {
        return response()->json($this->userDenganFlag($request->user()));
    }

    /**
     * Tandai apakah user punya penugasan mengajar — dipakai frontend agar
     * sidebar (grup "Guru Mapel") bisa dirender sinkron tanpa fetch dulu
     * (mencegah flicker saat pindah halaman).
     */
    private function userDenganFlag(User $user): array
    {
        return array_merge($user->toArray(), [
            'punya_penugasan_guru' => (bool) ($user->guru && $user->guru->guruMapelKelas()->exists()),
        ]);
    }
}
