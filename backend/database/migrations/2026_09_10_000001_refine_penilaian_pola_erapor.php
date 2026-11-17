<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Bedakan asesmen formatif (dikecualikan dari nilai akhir) vs sumatif (dihitung, pola e-rapor Kurikulum Merdeka)
        Schema::table('jenis_assessments', function (Blueprint $table) {
            $table->enum('kategori', ['formatif', 'sumatif'])->default('sumatif')->after('nama');
        });

        // Rentang konversi nilai angka ke predikat rapor — dikonfigurasi admin
        Schema::create('predikat_ranges', function (Blueprint $table) {
            $table->id();
            $table->string('nama', 50); // contoh: "Sangat Baik", "Baik"
            $table->decimal('nilai_min', 5, 2);
            $table->decimal('nilai_max', 5, 2);
            $table->timestamps();
        });

        // Deskripsi capaian kompetensi naratif per mapel per semester — dilengkapi wali kelas
        Schema::create('deskripsi_capaians', function (Blueprint $table) {
            $table->id();
            $table->foreignId('siswa_id')->constrained('siswas')->cascadeOnDelete();
            $table->foreignId('mapel_plus_id')->constrained('mapel_plus')->cascadeOnDelete();
            $table->foreignId('semester_id')->constrained('semesters')->cascadeOnDelete();
            $table->text('deskripsi');
            $table->timestamps();
            $table->unique(['siswa_id', 'mapel_plus_id', 'semester_id'], 'deskripsi_unique_per_semester');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('deskripsi_capaians');
        Schema::dropIfExists('predikat_ranges');
        Schema::table('jenis_assessments', function (Blueprint $table) {
            $table->dropColumn('kategori');
        });
    }
};
