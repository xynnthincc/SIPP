<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Port fitur rapor diniyah dari aplikasi e-rapor-plus: profil sekolah,
     * praktik & hafalan dinamis, nilai keterampilan, pembiasaan pagi, sikap,
     * rekap kehadiran, jejak edit nilai, nilai langsung per mapel (mix dengan
     * agregasi jenis assessment), serta data biodata santri yang diperkaya.
     */
    public function up(): void
    {
        Schema::create('sekolahs', function (Blueprint $table) {
            $table->id();
            $table->string('nama_sekolah')->default('NAMA SEKOLAH ANDA');
            $table->string('npsn')->nullable();
            $table->string('alamat')->nullable();
            $table->string('kelurahan')->nullable();
            $table->string('kecamatan')->nullable();
            $table->string('kota_kabupaten')->nullable();
            $table->string('provinsi')->nullable();
            $table->string('kode_pos')->nullable();
            $table->string('telepon')->nullable();
            $table->string('kepala_sekolah')->nullable();
            $table->string('nip_kepala_sekolah')->nullable();
            $table->timestamps();
        });

        // Item praktik & hafalan (dinamis, di luar mapel) — mis. Wudhu & Shalat, Juz 'Amma
        Schema::create('praktik_items', function (Blueprint $table) {
            $table->id();
            $table->string('kode')->unique();
            $table->string('nama_id');
            $table->string('nama_ar')->nullable();
            $table->unsignedInteger('urutan')->default(0);
            $table->timestamps();
        });

        Schema::create('guru_praktik', function (Blueprint $table) {
            $table->id();
            $table->foreignId('guru_id')->constrained('gurus')->cascadeOnDelete();
            $table->foreignId('praktik_item_id')->constrained('praktik_items')->cascadeOnDelete();
            $table->timestamps();
            $table->unique(['guru_id', 'praktik_item_id']);
        });

        // Nilai praktik/hafalan per santri per item per semester
        Schema::create('nilai_praktiks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('siswa_id')->constrained('siswas')->cascadeOnDelete();
            $table->foreignId('praktik_item_id')->constrained('praktik_items')->cascadeOnDelete();
            $table->foreignId('semester_id')->constrained('semesters')->cascadeOnDelete();
            $table->enum('nilai', ['A', 'B', 'C', 'D'])->nullable();
            $table->string('keterangan')->nullable();
            $table->timestamps();
            $table->unique(['siswa_id', 'praktik_item_id', 'semester_id'], 'nilai_praktik_unique_per_semester');
        });

        // Pembiasaan pagi (pengembangan diri, skala 0-100)
        Schema::create('pembiasaans', function (Blueprint $table) {
            $table->id();
            $table->foreignId('siswa_id')->constrained('siswas')->cascadeOnDelete();
            $table->foreignId('semester_id')->constrained('semesters')->cascadeOnDelete();
            $table->unsignedTinyInteger('nilai')->nullable();
            $table->timestamps();
            $table->unique(['siswa_id', 'semester_id'], 'pembiasaan_unique_per_semester');
        });

        // Sikap Akhlaq & Kepribadian
        Schema::create('sikaps', function (Blueprint $table) {
            $table->id();
            $table->foreignId('siswa_id')->constrained('siswas')->cascadeOnDelete();
            $table->foreignId('semester_id')->constrained('semesters')->cascadeOnDelete();
            $table->enum('akhlaq', ['A', 'B', 'C', 'D'])->nullable();
            $table->enum('kepribadian', ['A', 'B', 'C', 'D'])->nullable();
            $table->timestamps();
            $table->unique(['siswa_id', 'semester_id'], 'sikap_unique_per_semester');
        });

        // Rekap ketidakhadiran per semester
        Schema::create('kehadiran_rekaps', function (Blueprint $table) {
            $table->id();
            $table->foreignId('siswa_id')->constrained('siswas')->cascadeOnDelete();
            $table->foreignId('semester_id')->constrained('semesters')->cascadeOnDelete();
            $table->unsignedInteger('sakit')->default(0);
            $table->unsignedInteger('izin')->default(0);
            $table->unsignedInteger('alpa')->default(0);
            $table->timestamps();
            $table->unique(['siswa_id', 'semester_id'], 'kehadiran_unique_per_semester');
        });

        // Jejak "terakhir diubah oleh siapa & kapan" untuk data nilai
        Schema::create('log_edit_nilais', function (Blueprint $table) {
            $table->id();
            $table->foreignId('siswa_id')->constrained('siswas')->cascadeOnDelete();
            $table->foreignId('semester_id')->constrained('semesters')->cascadeOnDelete();
            $table->foreignId('updated_by')->constrained('users')->cascadeOnDelete();
            $table->timestamp('updated_at')->nullable();
            $table->unique(['siswa_id', 'semester_id'], 'log_edit_nilai_unique_per_semester');
        });

        // Nilai langsung per mapel per semester (opsi "mix"): bila terisi dipakai rapor,
        // jika kosong maka nilai akhir diambil dari agregasi jenis assessment.
        Schema::create('nilai_mapels', function (Blueprint $table) {
            $table->id();
            $table->foreignId('siswa_id')->constrained('siswas')->cascadeOnDelete();
            $table->foreignId('mapel_plus_id')->constrained('mapel_plus')->cascadeOnDelete();
            $table->foreignId('semester_id')->constrained('semesters')->cascadeOnDelete();
            $table->unsignedTinyInteger('kkm')->default(60);
            $table->unsignedTinyInteger('nilai')->nullable();
            $table->timestamps();
            $table->unique(['siswa_id', 'mapel_plus_id', 'semester_id'], 'nilai_mapel_unique_per_semester');
        });

        // Perluas mapel_plus dengan nama Arab, kelompok, KKM default, urutan cetak
        Schema::table('mapel_plus', function (Blueprint $table) {
            $table->string('nama_ar')->nullable()->after('nama');
            $table->string('kelompok', 50)->nullable()->after('nama_ar');
            $table->unsignedTinyInteger('kkm_default')->default(60)->after('kelompok');
            $table->unsignedInteger('urutan')->default(0)->after('kkm_default');
        });

        // Perkaya biodata santri (data induk lengkap dari e-rapor-plus)
        Schema::table('siswas', function (Blueprint $table) {
            $table->text('alamat')->nullable()->after('tanggal_lahir');
            $table->string('sekolah_asal')->nullable()->after('alamat');
            $table->string('nama_ayah')->nullable()->after('sekolah_asal');
            $table->string('nama_ibu')->nullable()->after('nama_ayah');
            $table->string('no_wa_ayah')->nullable()->after('nama_ibu');
            $table->string('profesi_ayah')->nullable()->after('no_wa_ayah');
            $table->string('profesi_ibu')->nullable()->after('profesi_ayah');
            $table->string('agama')->default('Islam')->after('profesi_ibu');
            $table->string('status_anak')->nullable()->after('agama');
            $table->string('anak_ke')->nullable()->after('status_anak');
            $table->string('no_telp')->nullable()->after('anak_ke');
            $table->string('foto')->nullable()->after('no_telp');
            $table->string('diterima_kelas')->nullable()->after('foto');
            $table->date('diterima_tanggal')->nullable()->after('diterima_kelas');
            $table->string('no_telp_ibu')->nullable()->after('diterima_tanggal');
            $table->text('alamat_ortu')->nullable()->after('no_telp_ibu');
            $table->string('nama_wali')->nullable()->after('alamat_ortu');
            $table->string('pekerjaan_wali')->nullable()->after('nama_wali');
            $table->text('alamat_wali')->nullable()->after('pekerjaan_wali');
            $table->string('no_telp_wali')->nullable()->after('alamat_wali');
        });

        // Tempat & tanggal rapor untuk dicetak di kop/penutup rapor
        Schema::table('semesters', function (Blueprint $table) {
            $table->string('tempat_tanggal_rapot')->nullable()->after('penilaian_dibuka');
        });
    }

    public function down(): void
    {
        Schema::table('semesters', function (Blueprint $table) {
            $table->dropColumn('tempat_tanggal_rapot');
        });

        Schema::table('siswas', function (Blueprint $table) {
            $table->dropColumn([
                'alamat', 'sekolah_asal', 'nama_ayah', 'nama_ibu', 'no_wa_ayah',
                'profesi_ayah', 'profesi_ibu', 'agama', 'status_anak', 'anak_ke',
                'no_telp', 'foto', 'diterima_kelas', 'diterima_tanggal', 'no_telp_ibu',
                'alamat_ortu', 'nama_wali', 'pekerjaan_wali', 'alamat_wali', 'no_telp_wali',
            ]);
        });

        Schema::table('mapel_plus', function (Blueprint $table) {
            $table->dropColumn(['nama_ar', 'kelompok', 'kkm_default', 'urutan']);
        });

        Schema::dropIfExists('nilai_mapels');
        Schema::dropIfExists('log_edit_nilais');
        Schema::dropIfExists('kehadiran_rekaps');
        Schema::dropIfExists('sikaps');
        Schema::dropIfExists('pembiasaans');
        Schema::dropIfExists('nilai_praktiks');
        Schema::dropIfExists('guru_praktik');
        Schema::dropIfExists('praktik_items');
        Schema::dropIfExists('sekolahs');
    }
};
