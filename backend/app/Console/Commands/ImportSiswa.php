<?php

namespace App\Console\Commands;

use App\Services\ImportSiswaService;
use Illuminate\Console\Command;

/**
 * Import siswa dari ekspor e-rapor "Daftar Peserta Didik per Kelas" (.xlsx).
 *
 * Logika parsing & penulisan ada di App\Services\ImportSiswaService — dipakai
 * bersama oleh endpoint API `POST /siswa/import` (UI Admin → Siswa).
 *
 * Contoh pemakaian:
 *   php artisan siswa:import "C:\Users\bandu\Downloads\Daftar_Siswa_Per_Kelas.xlsx"
 *   php artisan siswa:import <file> --dry-run
 */
class ImportSiswa extends Command
{
    protected $signature = 'siswa:import {file : Path file .xlsx ekspor e-rapor} {--dry-run : Tampilkan ringkasan tanpa menulis ke database}';

    protected $description = 'Import data siswa dari ekspor e-rapor (Daftar Peserta Didik per Kelas)';

    public function handle(ImportSiswaService $service): int
    {
        $file = (string) $this->argument('file');
        $dryRun = (bool) $this->option('dry-run');

        $plan = $service->rencana($file);
        if (! $plan['ok']) {
            $this->error($plan['error']);

            return self::FAILURE;
        }

        $r = $plan['ringkasan'];

        $this->info('Ringkasan import (sheet "Semua Siswa"):');
        $this->table(
            ['Metrik', 'Nilai'],
            [
                ['Baris data valid', $r['baris_valid']],
                ['Insert baru (NIS = NIPD)', $r['insert_nipd']],
                ['Insert baru (NIS = NISN, tanpa NIPD)', $r['insert_nisn']],
                ['Update (match NIPD)', $r['update_nipd']],
                ['Update (match nama+JK)', $r['update_nama']],
                ['Siswa DB tidak ada di file (tidak disentuh)', $r['tidak_disentuh']],
                ['Rombel di file tanpa kelas di DB', $r['rombel_tak_dikenal'] ? implode(', ', $r['rombel_tak_dikenal']) : '-'],
                ['Siswa tanpa rombel di file', $r['tanpa_rombel'] > 0 ? "{$r['tanpa_rombel']} siswa" : '-'],
                ['NIS duplikat di file', $r['duplikat_file'] ? $r['duplikat_file'].' baris' : '-'],
                ['Dilewati (data tidak cukup/bentrok)', $r['dilewati'] ? $r['dilewati'] : '-'],
            ]
        );
        foreach ($plan['peringatan'] as $pesan) {
            $this->warn($pesan);
        }
        if ($r['rombel_tak_dikenal']) {
            $this->warn('Siswa dengan rombel di atas diimport TANPA kelas (kelas_rombel_id NULL). Buat kelasnya dulu bila diperlukan.');
        }

        if ($dryRun) {
            $this->line('Mode --dry-run: tidak ada perubahan database.');

            return self::SUCCESS;
        }

        if (! $this->confirm('Lanjutkan menulis ke database?', true)) {
            return self::SUCCESS;
        }

        $hasil = $service->jalankan($plan);
        $this->info("Selesai: {$hasil['insert']} insert, {$hasil['update']} update.");

        return self::SUCCESS;
    }
}
