<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Izin digital: orang tua mengajukan, wali kelas menyetujui/menolak
        Schema::create('izins', function (Blueprint $table) {
            $table->id();
            $table->foreignId('siswa_id')->constrained('siswas')->cascadeOnDelete();
            $table->string('jenis')->comment('Sakit, Keperluan Keluarga, dll');
            $table->date('tanggal_mulai');
            $table->date('tanggal_selesai');
            $table->text('alasan');
            $table->string('lampiran')->nullable();
            $table->enum('status', ['pending', 'disetujui', 'ditolak'])->default('pending');
            $table->text('catatan')->nullable()->comment('Catatan wali kelas saat menanggapi');
            $table->foreignId('diajukan_oleh')->constrained('users')->cascadeOnDelete();
            $table->foreignId('disetujui_oleh')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('disetujui_waktu')->nullable();
            $table->timestamps();

            $table->index(['siswa_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('izins');
    }
};
