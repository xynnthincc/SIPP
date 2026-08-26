<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Mata pelajaran kepesantrenan: Tahfidz, Tahsin, Kitab Kuning, Bahasa Arab, Akhlak, dll
        Schema::create('mapel_plus', function (Blueprint $table) {
            $table->id();
            $table->string('kode')->unique();
            $table->string('nama');
            $table->text('deskripsi')->nullable();
            $table->boolean('punya_progres_hafalan')->default(false)
                ->comment('true untuk Tahfidz/Tahsin agar UI menampilkan tracker setoran');
            $table->timestamps();
        });

        // Guru yang mengampu mapel plus di kelas tertentu, per semester
        Schema::create('guru_mapel_kelas', function (Blueprint $table) {
            $table->id();
            $table->foreignId('guru_id')->constrained('gurus')->cascadeOnDelete();
            $table->foreignId('mapel_plus_id')->constrained('mapel_plus')->cascadeOnDelete();
            $table->foreignId('kelas_rombel_id')->constrained('kelas_rombels')->cascadeOnDelete();
            $table->foreignId('semester_id')->constrained('semesters')->cascadeOnDelete();
            $table->timestamps();
            $table->unique(['guru_id', 'mapel_plus_id', 'kelas_rombel_id', 'semester_id'], 'guru_mapel_kelas_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('guru_mapel_kelas');
        Schema::dropIfExists('mapel_plus');
    }
};
