<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        if (DB::getDriverName() === 'mysql') {
            DB::statement('ALTER TABLE `nilai_praktiks` MODIFY `nilai` VARCHAR(10) NULL');
            DB::statement("UPDATE `nilai_praktiks` SET `nilai` = CASE 
                WHEN `nilai` = 'A' THEN 90 
                WHEN `nilai` = 'B' THEN 80 
                WHEN `nilai` = 'C' THEN 70 
                WHEN `nilai` = 'D' THEN 60 
                ELSE `nilai` END 
                WHERE `nilai` IS NOT NULL AND `nilai` != ''");
            DB::statement('ALTER TABLE `nilai_praktiks` MODIFY `nilai` TINYINT UNSIGNED NULL');
        } else {
            DB::statement("UPDATE `nilai_praktiks` SET `nilai` = CASE 
                WHEN `nilai` = 'A' THEN 90 
                WHEN `nilai` = 'B' THEN 80 
                WHEN `nilai` = 'C' THEN 70 
                WHEN `nilai` = 'D' THEN 60 
                ELSE `nilai` END 
                WHERE `nilai` IS NOT NULL AND `nilai` != ''");
        }
    }

    public function down(): void
    {
        if (DB::getDriverName() === 'mysql') {
            DB::statement('ALTER TABLE `nilai_praktiks` MODIFY `nilai` VARCHAR(10) NULL');
            DB::statement("UPDATE `nilai_praktiks` SET `nilai` = CASE 
                WHEN `nilai` + 0 >= 90 THEN 'A' 
                WHEN `nilai` + 0 >= 80 THEN 'B' 
                WHEN `nilai` + 0 >= 70 THEN 'C' 
                ELSE 'D' END 
                WHERE `nilai` IS NOT NULL AND `nilai` != ''");
            DB::statement("ALTER TABLE `nilai_praktiks` MODIFY `nilai` ENUM('A','B','C','D') NULL");
        }
    }
};
