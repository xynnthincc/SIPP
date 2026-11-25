<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\GuruMapelKelas;
use App\Models\Jadwal;
use App\Models\Semester;
use Illuminate\Http\Request;

class JadwalController extends Controller
{
    public function index(Request $request)
    {
        // Semua pemilik profil guru (guru pesantren & wali kelas yang mengajar)
        // hanya melihat jadwal pengampuannya sendiri. Pengecualian: wali kelas
        // boleh melihat seluruh jadwal kelas binaannya (dipakai halaman presensi
        // harian wali kelas).
        $user = $request->user();
        $kelasDiminta = $request->integer('kelas_rombel_id') ?: null;
        $bolehLihatKelas = $kelasDiminta !== null
            && ($user->hasRole('admin', 'kepala_sekolah')
                || ($user->hasRole('wali_kelas')
                    && $user->kelasDiwalikan()->whereKey($kelasDiminta)->exists()));

        return Jadwal::with('guruMapelKelas.guru.user', 'guruMapelKelas.mapelPlus', 'guruMapelKelas.kelasRombel', 'guruMapelKelas.semester')
            ->when($user->guru && ! $bolehLihatKelas, function ($q) use ($user) {
                $q->whereHas('guruMapelKelas.guru', fn ($qq) => $qq->where('user_id', $user->id));
            })
            ->when($request->kelas_rombel_id, function ($q, $id) {
                $q->whereHas('guruMapelKelas', fn ($qq) => $qq->where('kelas_rombel_id', $id));
            })
            ->when($request->semester_id, function ($q, $id) {
                // Wadah Sementara memakai jadwal induk Akhir-nya (sama seperti pengampuan).
                $semester = Semester::find((int) $id);
                $semesterId = $semester ? $semester->induk()->id : (int) $id;
                $q->whereHas('guruMapelKelas', fn ($qq) => $qq->where('semester_id', $semesterId));
            })
            ->orderByRaw("CASE hari
                WHEN 'Senin' THEN 1 WHEN 'Selasa' THEN 2 WHEN 'Rabu' THEN 3
                WHEN 'Kamis' THEN 4 WHEN 'Jumat' THEN 5 WHEN 'Sabtu' THEN 6
                ELSE 7 END")
            ->orderBy('jam_mulai')
            ->get();
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'guru_mapel_kelas_id' => ['required', 'exists:guru_mapel_kelas,id'],
            'hari' => ['required', 'in:Senin,Selasa,Rabu,Kamis,Jumat,Sabtu,Minggu'],
            'jam_mulai' => ['required', 'date_format:H:i'],
            'jam_selesai' => ['required', 'date_format:H:i', 'after:jam_mulai'],
            'ruangan' => ['nullable', 'string'],
        ]);

        $this->pastikanGuruMapelKelas($request, (int) $data['guru_mapel_kelas_id']);

        return Jadwal::create($data);
    }

    public function update(Request $request, Jadwal $jadwal)
    {
        $data = $request->validate([
            'guru_mapel_kelas_id' => ['required', 'exists:guru_mapel_kelas,id'],
            'hari' => ['required', 'in:Senin,Selasa,Rabu,Kamis,Jumat,Sabtu,Minggu'],
            'jam_mulai' => ['required', 'date_format:H:i'],
            'jam_selesai' => ['required', 'date_format:H:i', 'after:jam_mulai'],
            'ruangan' => ['nullable', 'string'],
        ]);

        $this->pastikanJadwalMilik($request, $jadwal);
        $this->pastikanGuruMapelKelas($request, (int) $data['guru_mapel_kelas_id']);

        $jadwal->update($data);

        return $jadwal;
    }

    public function destroy(Request $request, Jadwal $jadwal)
    {
        $this->pastikanJadwalMilik($request, $jadwal);

        $jadwal->delete();

        return response()->noContent();
    }

    /** Pastikan penugasan yang dipakai pembuat jadwal benar-benar milik user login. */
    private function pastikanGuruMapelKelas(Request $request, int $id): GuruMapelKelas
    {
        $guruMapelKelas = GuruMapelKelas::findOrFail($id);
        $user = $request->user();

        if (! $user->hasRole('admin', 'kepala_sekolah')) {
            abort_unless(
                $guruMapelKelas->guru?->user_id === $user->id,
                403,
                'Anda bukan pengampu penugasan ini.'
            );
        }

        return $guruMapelKelas;
    }

    /** Jadwal yang diubah/dihapus harus masih menjadi pengampuannya sendiri. */
    private function pastikanJadwalMilik(Request $request, Jadwal $jadwal): void
    {
        $user = $request->user();

        if ($user->hasRole('admin', 'kepala_sekolah')) {
            return;
        }

        abort_unless(
            $jadwal->guruMapelKelas?->guru?->user_id === $user->id,
            403,
            'Anda bukan pengampu jadwal ini.'
        );
    }
}
