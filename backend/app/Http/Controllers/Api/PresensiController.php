<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Concerns\ScopesSiswaAccess;
use App\Http\Controllers\Controller;
use App\Models\Jadwal;
use App\Models\Presensi;
use Illuminate\Http\Request;

class PresensiController extends Controller
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

        return Presensi::with('siswa', 'jadwal.guruMapelKelas.mapelPlus')
            ->when($siswaId, fn ($q, $id) => $q->where('siswa_id', $id))
            ->when($request->jadwal_id, fn ($q, $id) => $q->where('jadwal_id', $id))
            ->when($request->tanggal, fn ($q, $t) => $q->whereDate('tanggal', $t))
            ->get();
    }

    /**
     * Input presensi massal untuk satu jadwal/hari (dipakai guru pesantren).
     * payload: { jadwal_id, tanggal, presensi: [{siswa_id, status, keterangan}] }
     */
    public function storeMassal(Request $request)
    {
        $data = $request->validate([
            'jadwal_id' => ['required', 'exists:jadwals,id'],
            'tanggal' => ['required', 'date'],
            'presensi' => ['required', 'array', 'min:1'],
            'presensi.*.siswa_id' => ['required', 'exists:siswas,id'],
            'presensi.*.status' => ['required', 'in:Hadir,Sakit,Izin,Alpa'],
            'presensi.*.keterangan' => ['nullable', 'string'],
        ]);

        $jadwal = Jadwal::findOrFail($data['jadwal_id']);
        $this->pastikanGuruPemilikJadwal($request, $jadwal);

        $hasil = collect($data['presensi'])->map(function ($item) use ($data, $request) {
            return Presensi::updateOrCreate(
                [
                    'siswa_id' => $item['siswa_id'],
                    'jadwal_id' => $data['jadwal_id'],
                    'tanggal' => $data['tanggal'],
                ],
                [
                    'status' => $item['status'],
                    'keterangan' => $item['keterangan'] ?? null,
                    'dicatat_oleh' => $request->user()->id,
                ]
            );
        });

        return response()->json($hasil);
    }

    private function pastikanGuruPemilikJadwal(Request $request, Jadwal $jadwal): void
    {
        $user = $request->user();

        if ($user->hasRole('admin', 'kepala_sekolah')) {
            return;
        }

        abort_unless(
            $jadwal->guruMapelKelas->guru->user_id === $user->id,
            403,
            'Anda bukan pengampu jadwal ini.'
        );
    }
}
