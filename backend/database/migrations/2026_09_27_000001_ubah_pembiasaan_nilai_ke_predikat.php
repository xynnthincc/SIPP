<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // SQLite (testing): affinity dinamis — string tersimpan tanpa ubah skema.
        if (DB::getDriverName() !== 'mysql') {
            return;
        }

        // Konversi nilai lama 0-100 ke predikat huruf mengikuti batas atas
        // legenda ketNilai sekolah (Istimewa 90+, Sangat Baik 80+, Baik 70+).
        // Urutan penting (strict mode): longgarkan tipe dulu, konversi, baru kunci ENUM.
        DB::statement('ALTER TABLE `pembiasaans` MODIFY `nilai` VARCHAR(2) NULL');
        DB::statement("UPDATE `pembiasaans` SET `nilai` = CASE WHEN `nilai` + 0 >= 90 THEN 'A' WHEN `nilai` + 0 >= 80 THEN 'B' WHEN `nilai` + 0 >= 70 THEN 'C' ELSE 'D' END WHERE `nilai` IS NOT NULL AND `nilai` != ''");
        DB::statement("ALTER TABLE `pembiasaans` MODIFY `nilai` ENUM('A','B','C','D') NULL");
    }

    public function down(): void
    {
        if (DB::getDriverName() !== 'mysql') {
            return;
        }

        // Lossy: huruf tidak bisa dikembalikan ke angka semula (jadi 0).
        DB::statement('ALTER TABLE `pembiasaans` MODIFY `nilai` TINYINT UNSIGNED NULL');
    }
};
