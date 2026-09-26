<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\GuruMapelKelas;
use Illuminate\Database\QueryException;
use Illuminate\Http\Request;

class GuruMapelKelasController extends Controller
{
    public function index(Request $request)
    {
        return GuruMapelKelas::with('guru.user', 'mapelPlus', 'kelasRombel', 'semester')
            ->when($request->guru_id, fn ($q, $id) => $q->where('guru_id', $id))
            ->when($request->semester_id, fn ($q, $id) => $q->where('semester_id', $id))
            ->get();
    }

    /**
     * Penugasan pengampuan milik user login (guru pesantren MAUPUN wali kelas
     * yang juga mengajar — siapa pun yang punya profil guru). Dipakai halaman
     * input nilai guru & untuk menampilkan menu "Guru Mapel" di dashboard wali kelas.
     */
    public function saya(Request $request)
    {
        $guru = $request->user()->guru;

        if (! $guru) {
            return response()->json([]);
        }

        return GuruMapelKelas::with('mapelPlus', 'kelasRombel.tahunAjaran', 'semester')
            ->where('guru_id', $guru->id)
            ->when($request->semester_id, fn ($q, $id) => $q->where('semester_id', $id))
            ->orderBy('semester_id')
            ->get();
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'guru_id' => ['required', 'exists:gurus,id'],
            'mapel_plus_id' => ['required', 'exists:mapel_plus,id'],
            'kelas_rombel_id' => ['required', 'exists:kelas_rombels,id'],
            'semester_id' => ['required', 'exists:semesters,id'],
        ]);

        if ($this->sudahAda($data)) {
            abort(422, 'Penugasan duplikat: guru ini sudah mengampu mapel tersebut di kelas dan semester yang sama.');
        }

        try {
            return GuruMapelKelas::create($data);
        } catch (QueryException $e) {
            // Pengaman kondisi balapan: constraint unik DB menolak duplikat —
            // tetap balas 422 yang ramah, bukan server error.
            if ($this->sudahAda($data)) {
                abort(422, 'Penugasan duplikat: guru ini sudah mengampu mapel tersebut di kelas dan semester yang sama.');
            }

            throw $e;
        }
    }

    public function update(Request $request, GuruMapelKelas $guruMapelKelas)
    {
        $data = $request->validate([
            'guru_id' => ['required', 'exists:gurus,id'],
            'mapel_plus_id' => ['required', 'exists:mapel_plus,id'],
            'kelas_rombel_id' => ['required', 'exists:kelas_rombels,id'],
            'semester_id' => ['required', 'exists:semesters,id'],
        ]);

        if ($this->sudahAda($data, $guruMapelKelas->id)) {
            abort(422, 'Penugasan duplikat: guru ini sudah mengampu mapel tersebut di kelas dan semester yang sama.');
        }

        try {
            $guruMapelKelas->update($data);
        } catch (QueryException $e) {
            if ($this->sudahAda($data, $guruMapelKelas->id)) {
                abort(422, 'Penugasan duplikat: guru ini sudah mengampu mapel tersebut di kelas dan semester yang sama.');
            }

            throw $e;
        }

        return $guruMapelKelas;
    }

    public function destroy(GuruMapelKelas $guruMapelKelas)
    {
        $guruMapelKelas->delete();

        return response()->noContent();
    }

    /**
     * Cek apakah kombinasi guru + mapel + kelas + semester sudah terdaftar
     * (constraint unik `guru_mapel_kelas_unique` di DB).
     */
    private function sudahAda(array $data, ?int $kecualiId = null): bool
    {
        return GuruMapelKelas::where('guru_id', $data['guru_id'])
            ->where('mapel_plus_id', $data['mapel_plus_id'])
            ->where('kelas_rombel_id', $data['kelas_rombel_id'])
            ->where('semester_id', $data['semester_id'])
            ->when($kecualiId !== null, fn ($q) => $q->where('id', '!=', $kecualiId))
            ->exists();
    }
}
