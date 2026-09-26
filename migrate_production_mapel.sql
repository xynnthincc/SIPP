-- ============================================================
-- SIPP Production: ganti daftar mapel_plus -> 11 mapel kurikulum revisi client
-- Run this in phpMyAdmin > SQL tab on the hosting database
--
-- URUTAN WAJIB:
--   1. Jalankan BLOK 0 (cek data) dulu, catat hasilnya.
--   2. BACKUP database (Export) — BLOK 2 MENGHAPUS mapel + nilai/penugasan/jadwal ikutannya (cascade)!
--   3. Baru jalankan BLOK 1-5.
--
-- Ringkasan perubahan:
--   EDIT (riwayat nilai & penugasan dipertahankan):
--     BAGDADY -> "Eja Baghdadi" (ar: قاعدة بغدادية)
--     QURAN   -> "Al-Qur'an"
--     BHS_ARAB-> nama_ar: اللغة العربية
--   TAMBAH: TAJWID (Tajwid), TARIKH (Tarikh) + jenis assessment default
--   HAPUS: TAHFIDZ, TAHSIN, KITAB_KUNING, JUZ_AMMA, P_SW
--   Urutan rapor: Al-Qur'an(1) Qaidah(2) Fiqih(3) Tauhid(4) Akhlaq(5)
--     Nahwu(6) Shorof(7) Tajwid(8) Tarikh(9) Bhs Arab(10) Hadits(11)
-- ============================================================

-- BLOK 0 — PRE-CHECK (read-only, aman): berapa baris ikut terhapus per mapel?
SELECT m.`kode`, m.`nama`,
  (SELECT COUNT(*) FROM `nilai_mapels` n WHERE n.`mapel_plus_id` = m.`id`) AS nilai_langsung,
  (SELECT COUNT(*) FROM `jenis_assessments` j WHERE j.`mapel_plus_id` = m.`id`) AS jenis_assessment,
  (SELECT COUNT(*) FROM `guru_mapel_kelas` g WHERE g.`mapel_plus_id` = m.`id`) AS penugasan,
  (SELECT COUNT(*) FROM `deskripsi_capaians` d WHERE d.`mapel_plus_id` = m.`id`) AS deskripsi
FROM `mapel_plus` m
WHERE m.`kode` IN ('TAHFIDZ', 'TAHSIN', 'KITAB_KUNING', 'JUZ_AMMA', 'P_SW')
ORDER BY m.`kode`;

-- BLOK 1 — Edit yang dipertahankan (aman, tanpa hapus data)
UPDATE `mapel_plus` SET `nama` = 'Eja Baghdadi', `nama_ar` = 'قاعدة بغدادية' WHERE `kode` = 'BAGDADY';
UPDATE `mapel_plus` SET `nama` = 'Al-Qur''an', `nama_ar` = 'القرآن' WHERE `kode` = 'QURAN';
UPDATE `mapel_plus` SET `nama_ar` = 'اللغة العربية' WHERE `kode` = 'BHS_ARAB';

-- BLOK 2 — Hapus mapel yang tidak dipakai (CASCADE: nilai, jenis+nilainya,
-- penugasan, jadwal+presensi ikutannya, deskripsi capaian). BACKUP DULU!
DELETE FROM `mapel_plus` WHERE `kode` IN ('TAHFIDZ', 'TAHSIN', 'KITAB_KUNING', 'JUZ_AMMA', 'P_SW');

-- BLOK 3 — Tambah mapel baru (idempoten via IGNORE; kode unik)
INSERT IGNORE INTO `mapel_plus` (`kode`, `nama`, `nama_ar`, `kkm_default`, `urutan`, `created_at`, `updated_at`) VALUES
  ('TAJWID', 'Tajwid', 'التجويد', 70, 8, NOW(), NOW()),
  ('TARIKH', 'Tarikh', 'التاريخ', 70, 9, NOW(), NOW());

-- BLOK 4 — Urutan rapor sesuai daftar client
UPDATE `mapel_plus` SET `urutan` = CASE `kode`
  WHEN 'QURAN' THEN 1 WHEN 'BAGDADY' THEN 2 WHEN 'FIQIH' THEN 3
  WHEN 'TAUHID' THEN 4 WHEN 'AKHLAK' THEN 5 WHEN 'NAHWU' THEN 6
  WHEN 'SHOROF' THEN 7 WHEN 'TAJWID' THEN 8 WHEN 'TARIKH' THEN 9
  WHEN 'BHS_ARAB' THEN 10 WHEN 'HADITS' THEN 11 ELSE `urutan` END
WHERE `kode` IN ('QURAN', 'BAGDADY', 'FIQIH', 'TAUHID', 'AKHLAK', 'NAHWU', 'SHOROF', 'TAJWID', 'TARIKH', 'BHS_ARAB', 'HADITS');

-- BLOK 5 — Jenis assessment default (UH/Tugas/UTS/UAS) utk mapel baru,
-- hanya bila mapel tsb belum punya jenis sama sekali (idempoten)
INSERT INTO `jenis_assessments` (`mapel_plus_id`, `nama`, `kategori`, `bobot`, `created_at`, `updated_at`)
SELECT m.`id`, v.`nama`, v.`kategori`, v.`bobot`, NOW(), NOW()
FROM `mapel_plus` m
CROSS JOIN (
  SELECT 'Ulangan Harian' AS `nama`, 'sumatif' AS `kategori`, 25 AS `bobot` UNION ALL
  SELECT 'Tugas', 'sumatif', 25 UNION ALL
  SELECT 'Ujian Tengah Semester', 'sumatif', 25 UNION ALL
  SELECT 'Ujian Akhir Semester', 'sumatif', 25
) v
WHERE m.`kode` IN ('TAJWID', 'TARIKH')
AND NOT EXISTS (SELECT 1 FROM `jenis_assessments` j WHERE j.`mapel_plus_id` = m.`id`);

-- BLOK 6 — Verifikasi (jalankan terpisah): harus 11 baris sesuai urutan
-- SELECT `urutan`, `kode`, `nama`, `nama_ar`, `kkm_default` FROM `mapel_plus` ORDER BY `urutan`;
