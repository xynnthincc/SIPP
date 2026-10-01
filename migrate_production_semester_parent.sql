-- ============================================================
-- SIPP Production Migration: semester Sementara jadi ANAK dari semester Akhir
-- Covers migration: 2026_09_22_000002_add_parent_to_semesters_table
-- Run this in phpMyAdmin > SQL tab on the hosting database
--
-- Konsep: hanya penyimpanan NILAI yang memakai wadah Sementara itu sendiri;
-- seluruh operasional (siswa, mapel, penugasan, jadwal, presensi) ikut induk.
-- Idempoten: aman dijalankan ulang.
-- ============================================================

-- 1. Tambah kolom parent_id (FK ke semesters, SET NULL bila induk dihapus)
ALTER TABLE `semesters`
  ADD COLUMN IF NOT EXISTS `parent_id` bigint(20) UNSIGNED NULL DEFAULT NULL
  COMMENT 'Semester Akhir induk; khusus jenis Sementara'
  AFTER `jenis`;
-- Catatan: bila constraint FK belum ada, tambahkan manual:
-- ALTER TABLE `semesters`
--   ADD CONSTRAINT `semesters_parent_id_foreign`
--   FOREIGN KEY (`parent_id`) REFERENCES `semesters` (`id`) ON DELETE SET NULL;

-- 2. Backfill: Sementara menunjuk ke Akhir bernama sama di TA yang sama
UPDATE `semesters` s
JOIN `semesters` induk
  ON induk.`tahun_ajaran_id` = s.`tahun_ajaran_id`
  AND induk.`nama` = s.`nama`
  AND induk.`jenis` = 'Akhir'
SET s.`parent_id` = induk.`id`
WHERE s.`jenis` = 'Sementara' AND s.`parent_id` IS NULL;

-- 3a. Normalisasi: hapus penugasan sementara yang KEMBAR dengan induknya
-- (agar tidak melanggar unique guru+mapel+kelas+semester)
DELETE g1 FROM `guru_mapel_kelas` g1
JOIN `semesters` s1 ON s1.`id` = g1.`semester_id` AND s1.`jenis` = 'Sementara' AND s1.`parent_id` IS NOT NULL
JOIN `guru_mapel_kelas` g2
  ON g2.`guru_id` = g1.`guru_id`
  AND g2.`mapel_plus_id` = g1.`mapel_plus_id`
  AND g2.`kelas_rombel_id` = g1.`kelas_rombel_id`
  AND g2.`semester_id` = s1.`parent_id`;

-- 3b. Normalisasi: pindahkan sisa penugasan sementara ke induknya
-- (jadwal & presensi ikut lewat id pengampu — tidak tersentuh)
UPDATE `guru_mapel_kelas` g
JOIN `semesters` s ON s.`id` = g.`semester_id` AND s.`jenis` = 'Sementara' AND s.`parent_id` IS NOT NULL
SET g.`semester_id` = s.`parent_id`;

-- 4. Daftarkan migration agar Laravel tidak re-run
INSERT IGNORE INTO `migrations` (`migration`, `batch`)
VALUES ('2026_09_22_000002_add_parent_to_semesters_table', (SELECT COALESCE(MAX(batch), 0) + 1 FROM migrations m1));

-- 5. Verifikasi (jalankan terpisah):
-- Setiap Sementara harus punya parent Akhir bernama sama:
-- SELECT s.`id`, s.`nama`, s.`jenis`, s.`parent_id`, induk.`nama` AS induk_nama, induk.`jenis` AS induk_jenis
-- FROM `semesters` s LEFT JOIN `semesters` induk ON induk.`id` = s.`parent_id`
-- WHERE s.`jenis` = 'Sementara';
-- Tidak boleh ada penugasan di wadah Sementara:
-- SELECT COUNT(*) AS penugasan_di_sementara FROM `guru_mapel_kelas` g
-- JOIN `semesters` s ON s.`id` = g.`semester_id` AND s.`jenis` = 'Sementara';
