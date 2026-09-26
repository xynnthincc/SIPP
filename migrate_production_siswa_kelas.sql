-- ============================================================
-- SIPP Production Migration: tabel siswa_kelas (riwayat penempatan)
-- Covers migration: 2026_09_22_000001_create_siswa_kelas_table
-- Run this in phpMyAdmin > SQL tab on the hosting database
--
-- WAJIB dijalankan — tanpanya /api/rapor/cetak (dan promosi/export)
-- error 500 karena kode baru query tabel ini.
-- Idempoten: aman dijalankan ulang (IF NOT EXISTS + INSERT IGNORE).
-- ============================================================

-- 1. Tabel siswa_kelas (riwayat penempatan siswa per kelas/TA)
CREATE TABLE IF NOT EXISTS `siswa_kelas` (
  `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
  `siswa_id` bigint(20) UNSIGNED NOT NULL,
  `kelas_rombel_id` bigint(20) UNSIGNED NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `siswa_kelas_unique` (`siswa_id`, `kelas_rombel_id`),
  CONSTRAINT `siswa_kelas_siswa_id_foreign` FOREIGN KEY (`siswa_id`) REFERENCES `siswas` (`id`) ON DELETE CASCADE,
  CONSTRAINT `siswa_kelas_kelas_rombel_id_foreign` FOREIGN KEY (`kelas_rombel_id`) REFERENCES `kelas_rombels` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Backfill: kelas saat ini tiap siswa jadi catatan penempatan
INSERT IGNORE INTO `siswa_kelas` (`siswa_id`, `kelas_rombel_id`, `created_at`, `updated_at`)
SELECT `id`, `kelas_rombel_id`, NOW(), NOW() FROM `siswas` WHERE `kelas_rombel_id` IS NOT NULL;

-- 3. Daftarkan migration agar Laravel tidak re-run
INSERT IGNORE INTO `migrations` (`migration`, `batch`)
VALUES ('2026_09_22_000001_create_siswa_kelas_table', (SELECT COALESCE(MAX(batch), 0) + 1 FROM migrations m1));

-- 4. Verifikasi (jalankan terpisah): harus mengembalikan 1 baris UTUH & jumlah riwayat = jumlah siswa berkelas
-- SHOW COLUMNS FROM `siswa_kelas` LIKE 'kelas_rombel_id';
-- SELECT COUNT(*) AS riwayat, (SELECT COUNT(*) FROM `siswas` WHERE `kelas_rombel_id` IS NOT NULL) AS siswa_berkelas FROM `siswa_kelas`;
