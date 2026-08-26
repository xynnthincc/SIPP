<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('rapors', function (Blueprint $table) {
            $table->id();
            $table->foreignId('siswa_id')->constrained('siswas')->cascadeOnDelete();
            $table->foreignId('semester_id')->constrained('semesters')->cascadeOnDelete();
            // Alur approval: Wali Kelas menyusun -> mengajukan -> Kepala Sekolah memvalidasi -> diterbitkan
            $table->enum('status', ['Draft', 'Diajukan', 'Divalidasi', 'Ditolak', 'Diterbitkan'])
                ->default('Draft');
            $table->text('catatan_wali_kelas')->nullable();
            $table->text('catatan_kepala_sekolah')->nullable();
            $table->foreignId('disusun_oleh')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('divalidasi_oleh')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('diajukan_at')->nullable();
            $table->timestamp('divalidasi_at')->nullable();
            $table->string('file_pdf')->nullable()->comment('Path file hasil export/print rapor');
            $table->timestamps();
            $table->unique(['siswa_id', 'semester_id'], 'rapor_unique_per_semester');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('rapors');
    }
};
