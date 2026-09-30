-- ============================================================
-- SIPP Production Migration: nilai_praktiks huruf (A/B/C/D) -> angka 0-100
-- Covers migration: 2026_09_30_000001_ubah_nilai_praktik_ke_angka
-- Run this in phpMyAdmin > SQL tab on the hosting database
--
-- WAJIB dijalankan — kode baru menyimpan nilai praktik ANGKA, sedangkan
-- kolom production masih ENUM('A','B','C','D'): setiap simpan nilai praktik
-- angka akan 500 (SQLSTATE 1265, data truncated).
-- Konversi nilai lama: A->90, B->80, C->70, D->60.
-- Idempoten: aman dijalankan ulang.
-- ============================================================

-- 1. Longgarkan tipe agar bisa menampung angka sementara
ALTER TABLE `nilai_praktiks` MODIFY `nilai` VARCHAR(10) NULL;

-- 2. Konversi huruf lama ke angka (baris yang sudah angka tidak tersentuh)
UPDATE `nilai_praktiks` SET `nilai` = CASE
  WHEN `nilai` = 'A' THEN 90
  WHEN `nilai` = 'B' THEN 80
  WHEN `nilai` = 'C' THEN 70
  WHEN `nilai` = 'D' THEN 60
  ELSE `nilai` END
WHERE `nilai` IS NOT NULL AND `nilai` != '';

-- 3. Kunci tipe ke angka
ALTER TABLE `nilai_praktiks` MODIFY `nilai` TINYINT UNSIGNED NULL;

-- 4. Daftarkan migration agar Laravel tidak re-run
INSERT IGNORE INTO `migrations` (`migration`, `batch`)
VALUES ('2026_09_30_000001_ubah_nilai_praktik_ke_angka', (SELECT COALESCE(MAX(batch), 0) + 1 FROM migrations m1));

-- 5. Verifikasi (jalankan terpisah): tipe harus tinyint, isi hanya angka/NULL
-- SHOW COLUMNS FROM `nilai_praktiks` LIKE 'nilai';
-- SELECT DISTINCT `nilai` FROM `nilai_praktiks`;
