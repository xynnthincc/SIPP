<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Riwayat penempatan siswa per kelas (kelas sudah terikat tahun ajaran).
        // Menjaga sejarah kenaikan kelas: nilai rapor lama tetap terhubung ke
        // kelas saat semester itu berjalan, walau siswa sudah pindah/naik kelas.
        Schema::create('siswa_kelas', function (Blueprint $table) {
            $table->id();
            $table->foreignId('siswa_id')->constrained('siswas')->cascadeOnDelete();
            $table->foreignId('kelas_rombel_id')->constrained('kelas_rombels')->cascadeOnDelete();
            $table->timestamps();
            $table->unique(['siswa_id', 'kelas_rombel_id'], 'siswa_kelas_unique');
        });

        // Backfill: kelas saat ini jadi catatan penempatan untuk TA kelas tsb
        $now = now();
        DB::table('siswas')->whereNotNull('kelas_rombel_id')->orderBy('id')->each(function ($siswa) use ($now) {
            DB::table('siswa_kelas')->insertOrIgnore([
                'siswa_id' => $siswa->id,
                'kelas_rombel_id' => $siswa->kelas_rombel_id,
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        }, 200);
    }

    public function down(): void
    {
        Schema::dropIfExists('siswa_kelas');
    }
};
