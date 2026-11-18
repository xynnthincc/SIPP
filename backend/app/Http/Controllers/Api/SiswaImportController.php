<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\ImportSiswaService;
use Illuminate\Http\Request;

class SiswaImportController extends Controller
{
    public function __construct(private ImportSiswaService $service) {}

    /**
     * Import siswa dari file .xlsx ekspor e-rapor "Daftar Peserta Didik per Kelas".
     *
     * Dua mode:
     *   - `dry_run=1` → hanya analisis + ringkasan (tidak menulis database).
     *   - tanpa `dry_run` → analisis lalu langsung tulis ke database.
     *
     * File wajib punya sheet "Semua Siswa" pada TA yang sedang aktif.
     */
    public function store(Request $request)
    {
        $request->validate([
            'file' => ['required', 'file', 'mimes:xlsx,xls', 'max:20480'],
            'dry_run' => ['nullable', 'boolean'],
        ], [
            'file.mimes' => 'File harus berformat Excel (.xlsx).',
            'file.max' => 'Ukuran file maksimal 20 MB.',
        ]);

        $path = $request->file('file')->getRealPath();
        $plan = $this->service->rencana($path);

        if (! $plan['ok']) {
            return response()->json(['message' => $plan['error']], 422);
        }

        $dryRun = $request->boolean('dry_run');

        if ($dryRun) {
            return response()->json([
                'dry_run' => true,
                'ringkasan' => $plan['ringkasan'],
                'peringatan' => array_slice($plan['peringatan'], 0, 20),
            ]);
        }

        $hasil = $this->service->jalankan($plan);

        return response()->json([
            'dry_run' => false,
            'hasil' => $hasil,
            'ringkasan' => $plan['ringkasan'],
            'peringatan' => array_slice($plan['peringatan'], 0, 20),
        ]);
    }
}
