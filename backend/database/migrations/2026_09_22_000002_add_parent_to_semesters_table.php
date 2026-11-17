<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Semester Sementara adalah ANAK dari semester Akhir (parent): wadah nilai
     * terpisah, tapi seluruh data operasional (siswa, mapel, penugasan,
     * jadwal, presensi) ikut parent. Satu-satunya pembeda hanya tempat
     * penyimpanan nilai.
     */
    public function up(): void
    {
        Schema::table('semesters', function (Blueprint $table) {
            $table->foreignId('parent_id')->nullable()->after('jenis')
                ->comment('Semester Akhir induk; khusus jenis Sementara')
                ->constrained('semesters')->nullOnDelete();
        });

        // Backfill: sementara menunjuk ke Akhir bernama sama di TA yang sama
        foreach (DB::table('semesters')->where('jenis', 'Sementara')->get() as $sem) {
            $parentId = DB::table('semesters')
                ->where('tahun_ajaran_id', $sem->tahun_ajaran_id)
                ->where('nama', $sem->nama)
                ->where('jenis', 'Akhir')
                ->value('id');

            if ($parentId) {
                DB::table('semesters')->where('id', $sem->id)->update(['parent_id' => $parentId]);
            }
        }

        // Normalisasi: penugasan yang telanjur dibuat di wadah sementara
        // dipindah ke parent (bila kembar dengan yang sudah ada di parent, yang
        // sementara dihapus agar tak melanggar unique). Jadwal & presensi ikut
        // lewat id pengampu — tidak tersentuh.
        $sementaras = DB::table('semesters')->where('jenis', 'Sementara')->whereNotNull('parent_id')->get();
        foreach ($sementaras as $sem) {
            $rows = DB::table('guru_mapel_kelas')->where('semester_id', $sem->id)->get();
            foreach ($rows as $row) {
                $kembar = DB::table('guru_mapel_kelas')
                    ->where('guru_id', $row->guru_id)
                    ->where('mapel_plus_id', $row->mapel_plus_id)
                    ->where('kelas_rombel_id', $row->kelas_rombel_id)
                    ->where('semester_id', $sem->parent_id)
                    ->exists();

                if ($kembar) {
                    DB::table('guru_mapel_kelas')->where('id', $row->id)->delete();
                } else {
                    DB::table('guru_mapel_kelas')->where('id', $row->id)->update(['semester_id' => $sem->parent_id]);
                }
            }
        }
    }

    public function down(): void
    {
        Schema::table('semesters', function (Blueprint $table) {
            $table->dropConstrainedForeignId('parent_id');
        });
    }
};
