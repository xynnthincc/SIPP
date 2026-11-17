<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Alur rapor diubah mengikuti e-rapor lama: rapor adalah cetakan real-time
 * dari data nilai (tanpa status/validasi/penerbitan), sehingga tabel rapors
 * tidak diperlukan lagi.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::dropIfExists('rapors');
    }

    public function down(): void
    {
        // Skema rapor lama sengaja tidak dipulihkan: alur sudah tidak memakai entitas rapor.
    }
};
