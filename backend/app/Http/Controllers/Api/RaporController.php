<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Rapor;
use App\Models\Siswa;
use Illuminate\Http\Request;

class RaporController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        return Rapor::with('siswa.kelasRombel', 'semester')
            ->when($user->hasRole('siswa'), fn ($q) => $q->whereHas('siswa', fn ($qq) => $qq->where('user_id', $user->id)))
            ->when($user->hasRole('orang_tua'), fn ($q) => $q->whereIn('siswa_id', $user->anakWali()->pluck('siswas.id')))
            ->when($user->hasRole('wali_kelas'), function ($q) use ($user) {
                $q->whereHas('siswa.kelasRombel', fn ($qq) => $qq->where('wali_kelas_id', $user->id));
            })
            ->when($request->siswa_id, fn ($q, $id) => $q->where('siswa_id', $id))
            ->when($request->semester_id, fn ($q, $id) => $q->where('semester_id', $id))
            ->when($request->status, fn ($q, $s) => $q->where('status', $s))
            ->get();
    }

    public function show(Rapor $rapor)
    {
        return $rapor->load('siswa.kelasRombel', 'siswa.nilais.jenisAssessment.mapelPlus', 'siswa.progresHafalans', 'siswa.presensis', 'semester');
    }

    /** Wali kelas menyusun draft rapor untuk siswa binaannya */
    public function store(Request $request)
    {
        $data = $request->validate([
            'siswa_id' => ['required', 'exists:siswas,id'],
            'semester_id' => ['required', 'exists:semesters,id'],
        ]);

        $siswa = Siswa::findOrFail($data['siswa_id']);
        $this->pastikanWaliKelasSiswa($request, $siswa);

        return Rapor::firstOrCreate($data, [
            'status' => Rapor::STATUS_DRAFT,
            'disusun_oleh' => $request->user()->id,
        ]);
    }

    /** Wali kelas mengajukan rapor ke kepala sekolah untuk divalidasi */
    public function ajukan(Request $request, Rapor $rapor)
    {
        $this->pastikanWaliKelasSiswa($request, $rapor->siswa);
        abort_unless($rapor->status === Rapor::STATUS_DRAFT, 422, 'Hanya rapor berstatus Draft yang dapat diajukan.');

        $data = $request->validate(['catatan_wali_kelas' => ['nullable', 'string']]);

        $rapor->update([
            'status' => Rapor::STATUS_DIAJUKAN,
            'catatan_wali_kelas' => $data['catatan_wali_kelas'] ?? $rapor->catatan_wali_kelas,
            'diajukan_at' => now(),
        ]);

        return $rapor;
    }

    /** Kepala sekolah memvalidasi/menolak rapor sebelum diterbitkan */
    public function validasi(Request $request, Rapor $rapor)
    {
        abort_unless($request->user()->hasRole('kepala_sekolah', 'admin'), 403);
        abort_unless($rapor->status === Rapor::STATUS_DIAJUKAN, 422, 'Hanya rapor berstatus Diajukan yang dapat divalidasi.');

        $data = $request->validate([
            'disetujui' => ['required', 'boolean'],
            'catatan_kepala_sekolah' => ['nullable', 'string'],
        ]);

        $rapor->update([
            'status' => $data['disetujui'] ? Rapor::STATUS_DIVALIDASI : Rapor::STATUS_DITOLAK,
            'catatan_kepala_sekolah' => $data['catatan_kepala_sekolah'] ?? null,
            'divalidasi_oleh' => $request->user()->id,
            'divalidasi_at' => now(),
        ]);

        return $rapor;
    }

    /** Terbitkan rapor yang sudah divalidasi (siap dicetak/diakses ortu) */
    public function terbitkan(Request $request, Rapor $rapor)
    {
        abort_unless($request->user()->hasRole('kepala_sekolah', 'admin'), 403);
        abort_unless($rapor->status === Rapor::STATUS_DIVALIDASI, 422, 'Rapor harus divalidasi terlebih dahulu.');

        $rapor->update(['status' => Rapor::STATUS_DITERBITKAN]);

        return $rapor;
    }

    private function pastikanWaliKelasSiswa(Request $request, Siswa $siswa): void
    {
        $user = $request->user();

        if ($user->hasRole('admin')) {
            return;
        }

        abort_unless(
            $user->hasRole('wali_kelas') && $siswa->kelasRombel?->wali_kelas_id === $user->id,
            403,
            'Anda bukan wali kelas siswa ini.'
        );
    }
}
