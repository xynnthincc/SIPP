<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CatatanGuruController;
use App\Http\Controllers\Api\DeskripsiCapaianController;
use App\Http\Controllers\Api\DeviceTokenController;
use App\Http\Controllers\Api\GuruController;
use App\Http\Controllers\Api\GuruMapelKelasController;
use App\Http\Controllers\Api\IzinController;
use App\Http\Controllers\Api\JadwalController;
use App\Http\Controllers\Api\JenisAssessmentController;
use App\Http\Controllers\Api\KelasRombelController;
use App\Http\Controllers\Api\MapelPlusController;
use App\Http\Controllers\Api\NilaiController;
use App\Http\Controllers\Api\NilaiDiniyahController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\PraktikItemController;
use App\Http\Controllers\Api\PredikatRangeController;
use App\Http\Controllers\Api\PresensiController;
use App\Http\Controllers\Api\ProgresHafalanController;
use App\Http\Controllers\Api\RaporController;
use App\Http\Controllers\Api\SekolahController;
use App\Http\Controllers\Api\SemesterController;
use App\Http\Controllers\Api\SiswaController;
use App\Http\Controllers\Api\TahunAjaranController;
use App\Http\Controllers\Api\UserController;
use Illuminate\Support\Facades\Route;

// ── Publik ──────────────────────────────────────────────
Route::post('/login', [AuthController::class, 'login'])->name('login');

// ── Wajib login ─────────────────────────────────────────
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);

    // Bisa diakses semua role login (read-only, discope di controller sesuai role)
    Route::get('/rapor/cetak', [RaporController::class, 'cetak']);
    Route::get('/rapor/pdf', [RaporController::class, 'pdf']);
    Route::get('/rapor/progres', [RaporController::class, 'progres']);
    Route::get('/sekolah', [SekolahController::class, 'show']);
    Route::get('/nilai-diniyah/rekap', [NilaiDiniyahController::class, 'rekap']);
    Route::get('/praktik-item', [PraktikItemController::class, 'index']);
    Route::get('/siswas/{siswa}/nilai-rekap/{semester}', [NilaiController::class, 'rekapSiswa']);
    Route::get('/progres-hafalan', [ProgresHafalanController::class, 'index']);
    Route::get('/catatan-guru', [CatatanGuruController::class, 'index']);
    Route::get('/presensi', [PresensiController::class, 'index']);
    Route::get('/nilai', [NilaiController::class, 'index']);
    Route::get('/jadwal', [JadwalController::class, 'index']);

    Route::get('/kelas-rombel', [KelasRombelController::class, 'index']);
    Route::get('/pengampuan-saya', [GuruMapelKelasController::class, 'saya']);

    // Notifikasi & perangkat (semua role)
    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::post('/notifications/read-all', [NotificationController::class, 'markAllRead']);
    Route::post('/notifications/{notification}/read', [NotificationController::class, 'markRead']);
    Route::post('/device-token', [DeviceTokenController::class, 'store']);
    Route::delete('/device-token', [DeviceTokenController::class, 'destroy']);

    // Izin digital — daftar di-scope per role di controller
    Route::get('/izin', [IzinController::class, 'index']);
    Route::get('/siswa', [SiswaController::class, 'index']);
    Route::get('/mapel-plus', [MapelPlusController::class, 'index']);
    Route::get('/jenis-assessment', [JenisAssessmentController::class, 'index']);
    Route::get('/predikat-range', [PredikatRangeController::class, 'index']);
    Route::get('/deskripsi-capaian', [DeskripsiCapaianController::class, 'index']);
    Route::get('/semester', [SemesterController::class, 'index']);
    Route::get('/tahun-ajaran', [TahunAjaranController::class, 'index']);

    // ── Admin: kelola seluruh data master, tahun ajaran, hak akses ──
    Route::middleware('role:admin')->group(function () {
        // Catatan: index sengaja TIDAK didaftarkan di sini — GET /tahun-ajaran & /semester
        // sudah terdaftar di atas untuk semua role. Route dengan method+URI identik yang
        // didaftarkan terakhir akan MENIMPA yang pertama, sehingga index versi admin-only
        // akan menutup akses role lain (bug 403 untuk wali kelas).
        Route::apiResource('tahun-ajaran', TahunAjaranController::class)->only(['store', 'update', 'destroy']);
        Route::post('/tahun-ajaran/{tahunAjaran}/promosi', [TahunAjaranController::class, 'promosi']);
        Route::apiResource('semester', SemesterController::class)->only(['store', 'update', 'destroy']);
        Route::apiResource('kelas-rombel', KelasRombelController::class)->except(['show', 'index']);
        Route::apiResource('guru', GuruController::class)->only(['index', 'store', 'update', 'destroy']);
        Route::apiResource('mapel-plus', MapelPlusController::class)->parameters(['mapel-plus' => 'mapelPlus'])->only(['store', 'update', 'destroy']);
        Route::apiResource('guru-mapel-kelas', GuruMapelKelasController::class)->only(['index', 'store', 'update', 'destroy']);
        Route::apiResource('jenis-assessment', JenisAssessmentController::class)->only(['store', 'update', 'destroy']);
        Route::apiResource('predikat-range', PredikatRangeController::class)->only(['store', 'update', 'destroy']);
        Route::post('/siswas/{siswa}/wali', [SiswaController::class, 'tambahWali']);
        // Profil sekolah = singleton (tanpa ID); GET-nya terdaftar di grup publik login
        Route::put('/sekolah', [SekolahController::class, 'update']);
        Route::apiResource('praktik-item', PraktikItemController::class)->parameters(['praktik-item' => 'praktikItem'])->only(['store', 'update', 'destroy']);
        Route::post('/gurus/{guru}/praktik', [GuruController::class, 'simpanPraktik']);
        Route::get('/user', [UserController::class, 'index']);
        Route::put('/user/{user}', [UserController::class, 'update']);
    });

    // ── Admin & Wali Kelas: kelola data master siswa ──
    Route::middleware('role:admin,wali_kelas')->group(function () {
        Route::apiResource('siswa', SiswaController::class)->except(['show', 'index']);
        Route::post('/siswas/{siswa}/foto', [SiswaController::class, 'uploadFoto']);
    });
    Route::get('/siswa/{siswa}', [SiswaController::class, 'show']);

    // ── Izin Digital: orang tua mengajukan, wali kelas menanggapi ──
    Route::middleware('role:orang_tua,admin')->group(function () {
        Route::post('/izin', [IzinController::class, 'store']);
    });
    Route::middleware('role:wali_kelas,admin')->group(function () {
        Route::post('/izin/{izin}/status', [IzinController::class, 'updateStatus']);
    });

    // ── Guru Pesantren & Wali Kelas yang mengajar: jadwal, presensi, assessment, nilai, progres, catatan ──
    // (wali kelas boleh masuk selama punya profil guru + penugasan pengampu; scope per item dicek di controller)
    Route::middleware('role:guru_pesantren,wali_kelas,admin')->group(function () {
        Route::apiResource('jadwal', JadwalController::class)->only(['store', 'update', 'destroy']);
        Route::post('/presensi/massal', [PresensiController::class, 'storeMassal']);
        Route::post('/nilai/massal', [NilaiController::class, 'storeMassal']);
        Route::post('/progres-hafalan', [ProgresHafalanController::class, 'store']);
        Route::post('/catatan-guru', [CatatanGuruController::class, 'store']);
    });

    // ── Input Nilai Diniyah: wali kelas & guru yang berhak (akses diceck per-mapel/praktik) ──
    Route::middleware('role:guru_pesantren,admin,wali_kelas')->group(function () {
        Route::post('/nilai-diniyah/simpan', [NilaiDiniyahController::class, 'simpan']);
        Route::get('/nilai-diniyah/massal', [NilaiDiniyahController::class, 'daftarMassal']);
        Route::post('/nilai-diniyah/massal', [NilaiDiniyahController::class, 'simpanMassal']);
    });

    // ── Export Excel daftar nilai kelas: wali kelas (kelasnya) & admin ──
    Route::middleware('role:wali_kelas,admin')->group(function () {
        Route::get('/nilai-diniyah/export', [NilaiDiniyahController::class, 'export']);
    });

    // ── Wali Kelas: deskripsi capaian rapor siswa binaannya ──
    Route::middleware('role:wali_kelas,admin')->group(function () {
        Route::post('/deskripsi-capaian', [DeskripsiCapaianController::class, 'store']);
    });
});
