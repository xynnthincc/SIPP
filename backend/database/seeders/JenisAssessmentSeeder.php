<?php

namespace Database\Seeders;

use App\Models\JenisAssessment;
use App\Models\MapelPlus;
use Illuminate\Database\Seeder;

/**
 * Jenis penilaian default per mapel — pola klasik e-rapor:
 * Ulangan Harian, Tugas, UTS, UAS dengan bobot merata (25% masing-masing).
 * Idempoten: mapel yang sudah punya jenis assessment tidak disentuh.
 */
class JenisAssessmentSeeder extends Seeder
{
    public function run(): void
    {
        $default = [
            ['nama' => 'Ulangan Harian', 'kategori' => 'sumatif', 'bobot' => 25],
            ['nama' => 'Tugas', 'kategori' => 'sumatif', 'bobot' => 25],
            ['nama' => 'Ujian Tengah Semester', 'kategori' => 'sumatif', 'bobot' => 25],
            ['nama' => 'Ujian Akhir Semester', 'kategori' => 'sumatif', 'bobot' => 25],
        ];

        foreach (MapelPlus::all() as $mapel) {
            if (JenisAssessment::where('mapel_plus_id', $mapel->id)->exists()) {
                continue;
            }

            foreach ($default as $jenis) {
                JenisAssessment::create([
                    'mapel_plus_id' => $mapel->id,
                    ...$jenis,
                ]);
            }

            $this->command?->info("Jenis assessment default dibuat untuk mapel {$mapel->nama}.");
        }
    }
}
