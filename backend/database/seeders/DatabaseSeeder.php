<?php

namespace Database\Seeders;

use App\Models\MapelPlus;
use App\Models\PredikatRange;
use App\Models\Semester;
use App\Models\TahunAjaran;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Akun admin default — ganti password ini setelah login pertama kali
        User::firstOrCreate(
            ['email' => 'admin@sipp.sch.id'],
            [
                'name' => 'Admin SIPP',
                'password' => Hash::make('password'),
                'role' => User::ROLE_ADMIN,
            ]
        );

        $tahunAjaran = TahunAjaran::firstOrCreate(
            ['nama' => '2026/2027'],
            ['is_aktif' => true]
        );

        Semester::firstOrCreate(
            ['tahun_ajaran_id' => $tahunAjaran->id, 'nama' => 'Ganjil'],
            ['is_aktif' => true, 'penilaian_dibuka' => true]
        );

        // Mata pelajaran kepesantrenan sesuai kurikulum pesantren (revisi client)
        $mapels = [
            ['kode' => 'QURAN', 'nama' => 'Al-Qur\'an', 'punya_progres_hafalan' => true],
            ['kode' => 'BAGDADY', 'nama' => 'Eja Baghdadi', 'punya_progres_hafalan' => false],
            ['kode' => 'FIQIH', 'nama' => 'Fiqih', 'punya_progres_hafalan' => false],
            ['kode' => 'TAUHID', 'nama' => 'Tauhid', 'punya_progres_hafalan' => false],
            ['kode' => 'AKHLAK', 'nama' => 'Akhlaq', 'punya_progres_hafalan' => false],
            ['kode' => 'NAHWU', 'nama' => 'Nahwu', 'punya_progres_hafalan' => false],
            ['kode' => 'SHOROF', 'nama' => 'Shorof', 'punya_progres_hafalan' => false],
            ['kode' => 'TAJWID', 'nama' => 'Tajwid', 'punya_progres_hafalan' => false],
            ['kode' => 'TARIKH', 'nama' => 'Tarikh', 'punya_progres_hafalan' => false],
            ['kode' => 'BHS_ARAB', 'nama' => 'Bahasa Arab', 'punya_progres_hafalan' => false],
            ['kode' => 'HADITS', 'nama' => 'Hadits', 'punya_progres_hafalan' => false],
        ];

        foreach ($mapels as $mapel) {
            MapelPlus::firstOrCreate(['kode' => $mapel['kode']], $mapel);
        }

        // Rentang predikat default mengikuti pola e-rapor Kurikulum Merdeka — bisa diubah admin
        $predikats = [
            ['nama' => 'Sangat Baik', 'nilai_min' => 86, 'nilai_max' => 100],
            ['nama' => 'Baik', 'nilai_min' => 71, 'nilai_max' => 85.99],
            ['nama' => 'Cukup', 'nilai_min' => 56, 'nilai_max' => 70.99],
            ['nama' => 'Perlu Bimbingan', 'nilai_min' => 0, 'nilai_max' => 55.99],
        ];

        foreach ($predikats as $predikat) {
            PredikatRange::firstOrCreate(['nama' => $predikat['nama']], $predikat);
        }

        // Data operasional pesantren: mapel plus, guru, kelas, pengampu, jadwal, siswa − idempoten
        $this->call(DataPesantrenSeeder::class);

        // Jenis penilaian default untuk tiap mapel (UH/Tugas/UTS/UAS) − idempoten
        $this->call(JenisAssessmentSeeder::class);
    }
}
