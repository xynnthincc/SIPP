<?php

namespace Database\Seeders;

use App\Models\MapelPlus;
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

        // Mata pelajaran kepesantrenan sesuai latar belakang proposal
        $mapels = [
            ['kode' => 'TAHFIDZ', 'nama' => 'Tahfidz', 'punya_progres_hafalan' => true],
            ['kode' => 'TAHSIN', 'nama' => 'Tahsin', 'punya_progres_hafalan' => true],
            ['kode' => 'KITAB_KUNING', 'nama' => 'Kitab Kuning', 'punya_progres_hafalan' => false],
            ['kode' => 'BHS_ARAB', 'nama' => 'Bahasa Arab', 'punya_progres_hafalan' => false],
            ['kode' => 'AKHLAK', 'nama' => 'Akhlak', 'punya_progres_hafalan' => false],
        ];

        foreach ($mapels as $mapel) {
            MapelPlus::firstOrCreate(['kode' => $mapel['kode']], $mapel);
        }
    }
}
