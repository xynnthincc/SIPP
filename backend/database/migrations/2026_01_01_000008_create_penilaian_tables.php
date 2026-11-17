<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Jenis assessment: Ujian Tahsin, Setoran Hafalan, Ujian Kitab Kuning, dll — dikonfigurasi bebas oleh admin/guru
        Schema::create('jenis_assessments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('mapel_plus_id')->constrained('mapel_plus')->cascadeOnDelete();
            $table->string('nama'); // contoh: "Setoran Harian", "Ujian Tengah Semester"
            $table->decimal('bobot', 5, 2)->default(100)->comment('Persentase bobot ke nilai akhir');
            $table->timestamps();
        });

        // Nilai per siswa per jenis assessment per semester
        Schema::create('nilais', function (Blueprint $table) {
            $table->id();
            $table->foreignId('siswa_id')->constrained('siswas')->cascadeOnDelete();
            $table->foreignId('jenis_assessment_id')->constrained('jenis_assessments')->cascadeOnDelete();
            $table->foreignId('semester_id')->constrained('semesters')->cascadeOnDelete();
            $table->decimal('nilai', 5, 2);
            $table->text('catatan')->nullable();
            $table->foreignId('dicatat_oleh')->constrained('users')->cascadeOnDelete();
            $table->timestamps();
            $table->unique(['siswa_id', 'jenis_assessment_id', 'semester_id'], 'nilai_unique_per_semester');
        });

        // Progres hafalan Tahfidz/Tahsin — tabel khusus karena butuh tracking surat/juz, bukan sekadar angka
        Schema::create('progres_hafalans', function (Blueprint $table) {
            $table->id();
            $table->foreignId('siswa_id')->constrained('siswas')->cascadeOnDelete();
            $table->foreignId('mapel_plus_id')->constrained('mapel_plus')->cascadeOnDelete();
            $table->date('tanggal_setoran');
            $table->string('materi'); // contoh: "Juz 30 - An-Naba", "Iqra Jilid 3"
            $table->enum('status', ['Lancar', 'Perlu Perbaikan', 'Mengulang']);
            $table->text('catatan')->nullable();
            $table->foreignId('dicatat_oleh')->constrained('users')->cascadeOnDelete();
            $table->timestamps();
        });

        // Catatan guru (perilaku, capaian, dsb) di luar nilai formal
        Schema::create('catatan_gurus', function (Blueprint $table) {
            $table->id();
            $table->foreignId('siswa_id')->constrained('siswas')->cascadeOnDelete();
            $table->foreignId('guru_id')->constrained('gurus')->cascadeOnDelete();
            $table->date('tanggal');
            $table->text('catatan');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('catatan_gurus');
        Schema::dropIfExists('progres_hafalans');
        Schema::dropIfExists('nilais');
        Schema::dropIfExists('jenis_assessments');
    }
};
