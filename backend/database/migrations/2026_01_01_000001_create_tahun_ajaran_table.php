<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tahun_ajarans', function (Blueprint $table) {
            $table->id();
            $table->string('nama'); // contoh: 2026/2027
            $table->boolean('is_aktif')->default(false);
            $table->timestamps();
        });

        Schema::create('semesters', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tahun_ajaran_id')->constrained()->cascadeOnDelete();
            $table->enum('nama', ['Ganjil', 'Genap']);
            $table->boolean('is_aktif')->default(false);
            $table->boolean('penilaian_dibuka')->default(true)
                ->comment('Kunci periode: guru hanya bisa input nilai selama true');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('semesters');
        Schema::dropIfExists('tahun_ajarans');
    }
};
