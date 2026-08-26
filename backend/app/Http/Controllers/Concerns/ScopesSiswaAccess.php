<?php

namespace App\Http\Controllers\Concerns;

use Illuminate\Http\Request;

/**
 * Guard agar siswa hanya bisa melihat datanya sendiri, dan orang tua/wali
 * hanya bisa melihat data anak yang terdaftar sebagai walinya.
 */
trait ScopesSiswaAccess
{
    private function pastikanBolehLihatSiswa(Request $request, int $siswaId): void
    {
        $user = $request->user();

        if ($user->hasRole('admin', 'guru_pesantren', 'wali_kelas', 'kepala_sekolah')) {
            return;
        }

        if ($user->hasRole('siswa')) {
            abort_unless($user->siswa?->id === $siswaId, 403, 'Anda hanya dapat melihat data Anda sendiri.');
            return;
        }

        if ($user->hasRole('orang_tua')) {
            abort_unless(
                $user->anakWali()->where('siswas.id', $siswaId)->exists(),
                403,
                'Anda hanya dapat melihat data anak yang terdaftar sebagai wali Anda.'
            );
            return;
        }

        abort(403);
    }
}
