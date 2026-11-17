<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('siswas', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete()
                ->comment('Akun login siswa, nullable jika belum diaktifkan');
            $table->string('nis')->unique();
            $table->string('nama');
            $table->foreignId('kelas_rombel_id')->nullable()->constrained('kelas_rombels')->nullOnDelete();
            $table->enum('jenis_kelamin', ['L', 'P']);
            $table->string('tempat_lahir')->nullable();
            $table->date('tanggal_lahir')->nullable();
            $table->boolean('is_aktif')->default(true);
            $table->timestamps();
        });

        // Relasi siswa - orang tua/wali (many-to-many: satu siswa bisa >1 wali, satu akun ortu bisa >1 anak)
        Schema::create('siswa_wali', function (Blueprint $table) {
            $table->id();
            $table->foreignId('siswa_id')->constrained('siswas')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->string('hubungan')->nullable(); // Ayah, Ibu, Wali
            $table->timestamps();
            $table->unique(['siswa_id', 'user_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('siswa_wali');
        Schema::dropIfExists('siswas');
    }
};
