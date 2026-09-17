<?php

namespace App\Support;

use App\Models\MapelPlus;
use App\Models\Nilai;
use App\Models\NilaiMapel;
use Illuminate\Support\Collection;

/**
 * Perhitungan nilai efektif mata pelajaran diniyah per semester.
 * Prioritas: nilai langsung (nilai_mapels) bila ada, jika kosong
 * pakai agregasi sumatif dari penilaian (jenis_assessments).
 */
class NilaiDiniyah
{
    public static function nilaiPerMapel(int $siswaId, int $semesterId): Collection
    {
        $langsung = NilaiMapel::where('siswa_id', $siswaId)
            ->where('semester_id', $semesterId)
            ->pluck('nilai', 'mapel_plus_id');

        $agregat = Nilai::with('jenisAssessment')
            ->where('siswa_id', $siswaId)
            ->where('semester_id', $semesterId)
            ->get()
            ->groupBy(fn ($n) => $n->jenisAssessment->mapel_plus_id)
            ->map(function ($items) {
                $sumatif = $items->filter(fn ($n) => $n->jenisAssessment->kategori === 'sumatif');
                $bobot = $sumatif->sum(fn ($n) => $n->jenisAssessment->bobot);

                return $bobot > 0
                    ? (int) round($sumatif->sum(fn ($n) => $n->nilai * $n->jenisAssessment->bobot) / $bobot)
                    : null;
            });

        $idMapel = $langsung->keys()->merge($agregat->keys())->unique();

        return $idMapel->mapWithKeys(fn ($id) => [$id => $langsung->get($id) ?? $agregat->get($id)]);
    }

    public static function daftarNilaiMapel(int $siswaId, int $semesterId): array
    {
        $efektif = static::nilaiPerMapel($siswaId, $semesterId);

        return MapelPlus::with('nilaiMapels')
            ->orderBy('urutan')
            ->orderBy('kode')
            ->get()
            ->map(function (MapelPlus $mapel) use ($siswaId, $semesterId, $efektif) {
                $row = $mapel->nilaiMapels
                    ->first(fn ($n) => $n->siswa_id === $siswaId && $n->semester_id === $semesterId);
                $nilai = $efektif->get($mapel->id);

                return [
                    'nilai' => $nilai ?? null,
                    'kkm' => $nilai !== null ? ($row?->kkm ?? $mapel->kkm_default) : null,
                ];
            })
            ->all();
    }
}
