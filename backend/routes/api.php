<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CatatanGuruController;
use App\Http\Controllers\Api\DeskripsiCapaianController;
use App\Http\Controllers\Api\GuruController;
use App\Http\Controllers\Api\GuruMapelKelasController;
use App\Http\Controllers\Api\JadwalController;
use App\Http\Controllers\Api\JenisAssessmentController;
use App\Http\Controllers\Api\KelasRombelController;
use App\Http\Controllers\Api\MapelPlusController;
use App\Http\Controllers\Api\NilaiController;
use App\Http\Controllers\Api\PredikatRangeController;
use App\Http\Controllers\Api\PresensiController;
use App\Http\Controllers\Api\ProgresHafalanController;
use App\Http\Controllers\Api\RaporController;
use App\Http\Controllers\Api\SemesterController;
use App\Http\Controllers\Api\SiswaController;
use App\Http\Controllers\Api\TahunAjaranController;
use Illuminate\Support\Facades\Route;

// ── Publik ──────────────────────────────────────────────
Route::post('/login', [AuthController::class, 'login']);

// ── Wajib login ─────────────────────────────────────────
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);

    // Bisa diakses semua role login (read-only, discope di controller sesuai role)
    Route::get('/rapors', [RaporController::class, 'index']);
    Route::get('/rapors/{rapor}', [RaporController::class, 'show']);
    Route::get('/siswas/{siswa}/nilai-rekap/{semester}', [NilaiController::class, 'rekapSiswa']);
    Route::get('/progres-hafalan', [ProgresHafalanController::class, 'index']);
    Route::get('/catatan-guru', [CatatanGuruController::class, 'index']);
    Route::get('/presensi', [PresensiController::class, 'index']);
    Route::get('/nilai', [NilaiController::class, 'index']);
    Route::get('/jadwal', [JadwalController::class, 'index']);

    Route::get('/kelas-rombel', [KelasRombelController::class, 'index']);
    Route::get('/siswa', [SiswaController::class, 'index']);
    Route::get('/mapel-plus', [MapelPlusController::class, 'index']);
    Route::get('/jenis-assessment', [JenisAssessmentController::class, 'index']);
    Route::get('/predikat-range', [PredikatRangeController::class, 'index']);
    Route::get('/deskripsi-capaian', [DeskripsiCapaianController::class, 'index']);

    // ── Admin: kelola seluruh data master, tahun ajaran, hak akses ──
    Route::middleware('role:admin')->group(function () {
        Route::apiResource('tahun-ajaran', TahunAjaranController::class)->except('show');
        Route::apiResource('semester', SemesterController::class)->only(['index', 'store', 'update', 'destroy']);
        Route::apiResource('kelas-rombel', KelasRombelController::class)->except(['show', 'index']);
        Route::apiResource('guru', GuruController::class)->only(['index', 'store', 'update', 'destroy']);
        Route::apiResource('mapel-plus', MapelPlusController::class)->parameters(['mapel-plus' => 'mapelPlus'])->only(['store', 'update', 'destroy']);
        Route::apiResource('guru-mapel-kelas', GuruMapelKelasController::class)->only(['index', 'store', 'destroy']);
        Route::apiResource('jenis-assessment', JenisAssessmentController::class)->only(['store', 'update', 'destroy']);
        Route::apiResource('predikat-range', PredikatRangeController::class)->only(['store', 'update', 'destroy']);
        Route::post('/siswas/{siswa}/wali', [SiswaController::class, 'tambahWali']);
    });

    // ── Admin & Wali Kelas: kelola data master siswa ──
    Route::middleware('role:admin,wali_kelas')->group(function () {
        Route::apiResource('siswa', SiswaController::class)->except(['show', 'index']);
    });
    Route::get('/siswa/{siswa}', [SiswaController::class, 'show']);

    // ── Guru Pesantren: input jadwal-nya, presensi, assessment, nilai, progres, catatan ──
    Route::middleware('role:guru_pesantren,admin')->group(function () {
        Route::apiResource('jadwal', JadwalController::class)->only(['store', 'destroy']);
        Route::post('/presensi/massal', [PresensiController::class, 'storeMassal']);
        Route::post('/nilai/massal', [NilaiController::class, 'storeMassal']);
        Route::post('/progres-hafalan', [ProgresHafalanController::class, 'store']);
        Route::post('/catatan-guru', [CatatanGuruController::class, 'store']);
    });

    // ── Wali Kelas: menyusun & mengajukan rapor siswa binaannya ──
    Route::middleware('role:wali_kelas,admin')->group(function () {
        Route::post('/rapors', [RaporController::class, 'store']);
        Route::post('/rapors/{rapor}/ajukan', [RaporController::class, 'ajukan']);
        Route::post('/deskripsi-capaian', [DeskripsiCapaianController::class, 'store']);
    });

    // ── Kepala Sekolah: validasi & terbitkan rapor ──
    Route::middleware('role:kepala_sekolah,admin')->group(function () {
        Route::post('/rapors/{rapor}/validasi', [RaporController::class, 'validasi']);
        Route::post('/rapors/{rapor}/terbitkan', [RaporController::class, 'terbitkan']);
    });
});
