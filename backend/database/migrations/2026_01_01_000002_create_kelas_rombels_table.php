<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('kelas_rombels', function (Blueprint $table) {
            $table->id();
            $table->string('nama'); // contoh: VII-A
            $table->unsignedTinyInteger('tingkat'); // 7, 8, 9
            $table->foreignId('wali_kelas_id')->nullable()
                ->constrained('users')->nullOnDelete();
            $table->foreignId('tahun_ajaran_id')->constrained()->cascadeOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('kelas_rombels');
    }
};
