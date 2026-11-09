-- ============================================================
-- SIPP Production Migration: nilai mapel & praktik boleh DESIMAL
-- Covers migration: 2026_09_23_000001_nilai_to_decimal
-- Run this in phpMyAdmin > SQL tab on the hosting database
--
-- Konsep: guru/admin boleh menginput nilai pecahan (mis. 85.5) — kolom `nilai`
-- pada nilai_mapels & nilai_praktiks diperlebar dari tinyint UNSIGNED menjadi
-- decimal(5,2) mengikuti nilais.nilai yang memang sudah decimal.
-- Rentang 0–100 tetap divalidasi di controller API.
-- Idempoten: aman dijalankan ulang (MODIFY ke tipe sama tidak error).
-- ============================================================

-- 1. Nilai akhir langsung per mapel per semester (boleh desimal)
ALTER TABLE `nilai_mapels`
  MODIFY COLUMN `nilai` decimal(5,2) NULL DEFAULT NULL
  COMMENT 'Nilai akhir langsung (boleh desimal)' AFTER `kkm`;

-- 2. Nilai praktik/hafalan per item per semester (boleh desimal)
ALTER TABLE `nilai_praktiks`
  MODIFY COLUMN `nilai` decimal(5,2) NULL DEFAULT NULL
  COMMENT 'Nilai praktik/hafalan (boleh desimal)' AFTER `praktik_item_id`;

-- 3. Daftarkan migration agar `php artisan migrate` tidak mencoba re-run
INSERT IGNORE INTO `migrations` (`migration`, `batch`)
VALUES ('2026_09_23_000001_nilai_to_decimal', (SELECT COALESCE(MAX(batch), 0) + 1 FROM migrations m1));

-- 4. Verifikasi (jalankan terpisah):
-- SHOW COLUMNS FROM `nilai_mapels` LIKE 'nilai';
-- SHOW COLUMNS FROM `nilai_praktiks` LIKE 'nilai';
-- Keduanya harus tampil Type: decimal(5,2), Null: YES
