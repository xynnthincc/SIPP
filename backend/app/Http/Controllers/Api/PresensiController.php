<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Concerns\ScopesSiswaAccess;
use App\Http\Controllers\Controller;
use App\Models\Jadwal;
use App\Models\Presensi;
use App\Models\Siswa;
use Illuminate\Http\Request;

class PresensiController extends Controller
{
    use ScopesSiswaAccess;

    public function index(Request $request)
    {
        $request->validate([
            'siswa_id' => ['nullable', 'integer'],
            'jadwal_id' => ['nullable', 'integer'],
            'tanggal' => ['nullable', 'date_format:Y-m-d'],
        ]);

        $user = $request->user();
        $siswaId = $request->siswa_id;

        if ($user->hasRole('siswa')) {
            $siswaId = $user->siswa?->id;
        } elseif ($siswaId) {
            $this->pastikanBolehLihatSiswa($request, (int) $siswaId);
        } elseif ($user->hasRole('orang_tua')) {
            abort(422, 'Parameter siswa_id wajib diisi untuk akun orang tua.');
        }

        $query = Presensi::with('siswa', 'jadwal.guruMapelKelas.mapelPlus')
            ->when($siswaId, fn ($q, $id) => $q->where('siswa_id', $id))
            ->when($request->jadwal_id, fn ($q, $id) => $q->where('jadwal_id', $id))
            ->when($request->tanggal, fn ($q, $t) => $q->whereDate('tanggal', $t));

        // Guru pesantren hanya melihat presensi pada jadwal yang diampunya;
        // wali kelas melihat presensi siswa di kelas binaannya.
        if ($user->hasRole('guru_pesantren')) {
            abort_unless($user->guru, 403, 'Profil guru tidak ditemukan untuk akun ini.');
            $query->whereHas(
                'jadwal.guruMapelKelas.guru',
                fn ($q) => $q->where('user_id', $user->id)
            );
        } elseif ($user->hasRole('wali_kelas')) {
            $query->whereHas('siswa', fn ($q) => $q
                ->whereIn('kelas_rombel_id', $this->kelasYangBolehDiakses($user)));
        }

        return $query->get();
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

        $siswaIds = collect($data['presensi'])->pluck('siswa_id');
        abort_unless($siswaIds->duplicates()->isEmpty(), 422, 'Siswa duplikat dalam payload presensi.');

        $kelasId = $jadwal->guruMapelKelas?->kelas_rombel_id;
        $siswas = Siswa::with('kelasHistories')->whereIn('id', $siswaIds)->get();
        abort_unless($siswas->count() === $siswaIds->unique()->count(), 422, 'Ada siswa dalam payload yang tidak ditemukan.');

        foreach ($siswas as $siswa) {
            $terdaftar = $siswa->kelas_rombel_id === $kelasId
                || $siswa->kelasHistories->contains('kelas_rombel_id', $kelasId);

            abort_unless($terdaftar, 403, 'Siswa bukan anggota kelas pada jadwal ini.');
        }

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
