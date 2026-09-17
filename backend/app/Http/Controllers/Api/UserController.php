<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class UserController extends Controller
{
    /** Daftar seluruh akun login (admin) — bisa difilter per role, dicari, dan dipaginate. */
    public function index(Request $request)
    {
        $role = $request->validate([
            'role' => ['nullable', Rule::in([
                User::ROLE_ADMIN,
                User::ROLE_GURU_PESANTREN,
                User::ROLE_WALI_KELAS,
                User::ROLE_KEPALA_SEKOLAH,
                User::ROLE_SISWA,
                User::ROLE_ORANG_TUA,
            ])],
            'search' => ['nullable', 'string'],
        ])['role'] ?? null;

        $search = $request->input('search');

        $query = User::query()
            ->when($role, fn ($q) => $q->where('role', $role))
            ->when($search, function ($q, $s) {
                $q->where(function ($sub) use ($s) {
                    $sub->where('name', 'like', "%{$s}%")
                        ->orWhere('email', 'like', "%{$s}%")
                        ->orWhere('identifier', 'like', "%{$s}%")
                        ->orWhereHas('guru', fn ($g) => $g->where('nip', 'like', "%{$s}%"));
                });
            })
            ->with('guru:id,user_id,nip')
            ->orderBy('name');

        if ($request->has('page')) {
            return $query->paginate(20);
        }

        return $query->get();
    }

    /** Kelola kredensial akun: nama, email login, password, dan status aktif. */
    public function update(Request $request, User $user)
    {
        $data = $request->validate([
            'name' => ['sometimes', 'string', 'max:100'],
            'email' => ['sometimes', 'email', 'max:255', Rule::unique('users', 'email')->ignore($user->id)],
            'password' => ['nullable', 'string', 'min:8'],
            'is_active' => ['sometimes', 'boolean'],
        ], [
            'email.unique' => 'Email sudah dipakai akun lain.',
            'password.min' => 'Password baru minimal 8 karakter.',
        ]);

        if ($user->is($request->user()) && (($data['is_active'] ?? true) === false)) {
            abort(422, 'Anda tidak dapat menonaktifkan akun Anda sendiri.');
        }

        $gantiPassword = filled($data['password'] ?? null);
        if ($gantiPassword) {
            $data['password'] = Hash::make($data['password']);
        } else {
            unset($data['password']);
        }

        $user->update($data);

        // Jaga nama akun login tetap sinkron dengan nama profil guru
        if (isset($data['name']) && $user->guru) {
            $user->guru->update(['nama' => $data['name']]);
        }

        // Ganti password / dinonaktifkan → paksa logout di semua perangkat
        if ($gantiPassword || $user->is_active === false) {
            $user->tokens()->delete();
        }

        return $user;
    }
}
