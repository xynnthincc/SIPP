<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Jadwal;
use Illuminate\Http\Request;

class JadwalController extends Controller
{
    public function index(Request $request)
    {
        // Guru pesantren hanya lihat jadwal miliknya sendiri
        $user = $request->user();

        return Jadwal::with('guruMapelKelas.guru.user', 'guruMapelKelas.mapelPlus', 'guruMapelKelas.kelasRombel')
            ->when($user->hasRole('guru_pesantren'), function ($q) use ($user) {
                $q->whereHas('guruMapelKelas.guru', fn ($qq) => $qq->where('user_id', $user->id));
            })
            ->when($request->kelas_rombel_id, function ($q, $id) {
                $q->whereHas('guruMapelKelas', fn ($qq) => $qq->where('kelas_rombel_id', $id));
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

        return Jadwal::create($data);
    }

    public function destroy(Jadwal $jadwal)
    {
        $jadwal->delete();

        return response()->noContent();
    }
}
