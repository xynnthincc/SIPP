-- ============================================================
-- SIPP Production Migration: pembiasaan 0-100 -> predikat A/B/C/D
-- Covers migration: 2026_09_27_000001_ubah_pembiasaan_nilai_ke_predikat
-- Run this in phpMyAdmin > SQL tab on the hosting database
--
-- Urutan penting (strict mode): longgarkan tipe -> konversi -> kunci ENUM.
-- Konversi nilai lama mengikuti batas atas legenda ketNilai sekolah
-- (Istimewa 90+ -> A, Sangat Baik 80+ -> B, Baik 70+ -> C, sisanya -> D).
-- Idempoten bila dijalankan bertahap; JANGAN jalankan ulang blok 2 setelah
-- blok 3 sukses (huruf akan jatuh ke 'D').
-- ============================================================

-- 1. Longgarkan tipe agar bisa menampung huruf sementara
ALTER TABLE `pembiasaans` MODIFY `nilai` VARCHAR(2) NULL;

-- 2. Konversi angka lama ke huruf (SKIP bila sudah pernah dikonversi)
UPDATE `pembiasaans` SET `nilai` = CASE WHEN `nilai` + 0 >= 90 THEN 'A' WHEN `nilai` + 0 >= 80 THEN 'B' WHEN `nilai` + 0 >= 70 THEN 'C' ELSE 'D' END WHERE `nilai` IS NOT NULL AND `nilai` NOT IN ('A', 'B', 'C', 'D');

-- 3. Kunci tipe ke ENUM predikat
ALTER TABLE `pembiasaans` MODIFY `nilai` ENUM('A','B','C','D') NULL;

-- 4. Daftarkan migration agar Laravel tidak re-run
INSERT IGNORE INTO `migrations` (`migration`, `batch`)
VALUES ('2026_09_27_000001_ubah_pembiasaan_nilai_ke_predikat', (SELECT COALESCE(MAX(batch), 0) + 1 FROM migrations m1));

-- 5. Verifikasi (jalankan terpisah): nilai hanya boleh A/B/C/D/NULL
-- SELECT DISTINCT `nilai` FROM `pembiasaans`;
