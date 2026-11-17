# SIPP — Sistem Informasi Pembelajaran Pesantren

**MVP: E-Rapor Pesantren/Plus (Berbasis Web)**
Studi kasus: **SMP Plus YPP Darussurur**

Proyek Produk Rekayasa Perangkat Lunak — Konsentrasi Keahlian Rekayasa Perangkat Lunak, SMK Negeri 1 Cimahi (2026).

Disusun oleh:
- Andika Putra (NIS: 241117867) — Desain antarmuka & pengembangan frontend
- Zakii Maulana Maalik (NIS: 241117901) — Analisis kebutuhan, desain sistem & pengembangan backend

---

## 1. Latar Belakang

SMP Plus YPP Darussurur adalah sekolah berbasis pesantren yang memadukan kurikulum nasional dengan pembelajaran kepesantrenan (Tahfidz, Tahsin, Kitab Kuning, Bahasa Arab, Akhlak). Penilaian mata pelajaran umum sudah difasilitasi oleh e-rapor resmi pemerintah (Kemendikdasmen, terhubung Dapodik), sehingga **di luar cakupan proyek ini**.

Namun seluruh proses pembelajaran kepesantrenan — penjadwalan, presensi, penilaian, pencatatan progres Tahfidz/Tahsin, catatan guru, hingga rapor pesantren — masih dilakukan manual/semi-manual (buku catatan & spreadsheet terpisah antar guru). Hal ini menyebabkan rekap data lambat, rawan salah input, progres santri sulit dipantau berkelanjutan, dan orang tua baru mengetahui hasil belajar saat pembagian rapor per semester.

> **Catatan desain:** karena SIPP berdampingan dengan e-rapor pemerintah (bukan menggantikannya), pola penilaian dan alur kerja di bawah ini sengaja dirancang **semirip mungkin** dengan e-rapor resmi (Kurikulum Merdeka) — supaya guru dan wali kelas tidak perlu belajar dua logika penilaian yang berbeda. Bagian yang sengaja berbeda dari pola resmi ditandai eksplisit di bawah, beserta alasannya.

## 2. Tujuan

1. Membangun SIPP untuk mengelola data master, jadwal, presensi, penilaian, dan rapor pesantren secara terpusat, dimulai dari **MVP berbasis web** (modul E-Rapor Pesantren/Plus).
2. Mempercepat proses input presensi, assessment, nilai, catatan guru, serta rekap nilai hingga penerbitan rapor.
3. Menyediakan akses pemantauan bagi orang tua/wali (Tahfidz/Tahsin, nilai, presensi, catatan guru) pada tahap lanjutan (mobile).
4. Menyusun roadmap pengembangan bertahap: MVP web → aplikasi mobile guru → aplikasi mobile orang tua.

## 3. Roadmap Pengembangan

| Tahap | Platform | Fokus | Fitur Utama |
|---|---|---|---|
| **MVP** (proyek ini) | Web | E-Rapor Pesantren/Plus | Master siswa, master guru, kelas/rombel, mata pelajaran plus, aktivitas pesantren, jadwal, presensi, assessment (formatif & sumatif), nilai & predikat, catatan guru, rekap nilai & deskripsi capaian, generate rapor, export/print PDF, tahun ajaran & semester, role & permission |
| Phase 2 | Mobile Guru | Operasional harian | Jadwal hari ini, presensi, quick assessment, input nilai, catatan siswa, progress Tahfidz/Tahsin, notifikasi |
| Phase 3 | Mobile Orang Tua | Monitoring progres siswa | Progress anak, nilai pesantren, Tahfidz, Tahsin, presensi, catatan guru, notifikasi, rapor digital |

Proposal dan repository ini berfokus pada **MVP**; Phase 2 & 3 adalah roadmap lanjutan setelah MVP berjalan dan dievaluasi.

## 4. Pengguna & Hak Akses (Role)

| Level Akun | Kewenangan |
|---|---|
| **Admin/Operator Sekolah** | Mengelola seluruh data master, tahun ajaran/semester (termasuk buka/tutup periode penilaian), mengatur hak akses pengguna lain, backup data |
| **Guru Pesantren** | Mengisi jadwal, presensi, assessment (formatif & sumatif), nilai, progres hafalan, dan catatan untuk siswa yang diampu selama periode penilaian dibuka |
| **Wali Kelas** | Melihat rekap nilai & catatan seluruh siswa binaannya, melengkapi deskripsi capaian per mapel, mengajukan rapor pesantren untuk validasi |
| **Kepala Sekolah** | Melihat rekap menyeluruh, memvalidasi/menolak rapor yang diajukan per siswa, menerbitkan rapor yang sudah valid |
| **Siswa** | Melihat nilai dan rapor pesantren milik sendiri |
| **Orang Tua/Wali** | Melihat nilai dan rapor pesantren anak yang terdaftar sebagai walinya (akses penuh pada Phase 3) |

> Guru mata pelajaran umum **bukan** pengguna sistem ini, karena penilaiannya sudah difasilitasi e-rapor pemerintah/Dapodik.

## 5. Ruang Lingkup MVP

Modul yang dibangun pada tahap MVP (web):
- Data master: siswa, guru, kelas/rombel, mata pelajaran plus, tahun ajaran & semester
- Aktivitas pesantren & penjadwalan
- Presensi (Hadir/Sakit/Izin/Alpa)
- Assessment & penilaian — **dibedakan formatif vs sumatif** (lihat §6)
- Progres Tahfidz/Tahsin (skala kualitatif: Lancar / Perlu Perbaikan / Mengulang)
- Catatan guru
- Rekap nilai akhir (angka + **predikat**) dan **deskripsi capaian** per mapel
- Alur persetujuan rapor (wali kelas → kepala sekolah)
- Generate & export/print rapor pesantren (PDF)
- Role & permission (RBAC) sesuai tabel di atas

## 6. Pola Penilaian (disamakan dengan e-rapor pemerintah)

Pola berikut mengikuti kaidah penilaian Kurikulum Merdeka yang dipakai e-rapor resmi (Kemendikdasmen), diadaptasi untuk mapel plus:

| Konsep resmi | Penerapan di SIPP |
|---|---|
| Asesmen **formatif** (umpan balik proses, tidak dihitung ke nilai akhir) | Jenis assessment dapat ditandai `formatif` — nilainya tercatat & terlihat guru/wali kelas, tapi **dikecualikan** dari perhitungan nilai akhir |
| Asesmen **sumatif** (harian, tengah semester, akhir semester — dihitung ke nilai akhir) | Jenis assessment ditandai `sumatif` dengan bobot (%); nilai akhir = rata-rata tertimbang seluruh assessment sumatif |
| Predikat/kategori capaian di rapor cetak | Nilai akhir angka dikonversi otomatis ke predikat (mis. Sangat Baik/Baik/Cukup/Perlu Bimbingan) berdasarkan rentang yang dikonfigurasi admin |
| Deskripsi capaian kompetensi per mapel | Wali kelas/guru melengkapi catatan naratif singkat per mapel sebagai bagian rapor, bukan hanya angka |
| Kategori kehadiran S/I/A | Presensi memakai status Sakit/Izin/Alpa (selain Hadir) — sudah sama dengan pola resmi |
| Kategori kualitatif untuk kegiatan non-akademik (mis. P5/kokurikuler) | Progres Tahfidz/Tahsin memakai skala kualitatif serupa (Lancar/Perlu Perbaikan/Mengulang) |

**Yang sengaja dibuat berbeda dari pola resmi (keputusan desain, bukan kekeliruan):**
- Di e-rapor resmi, Kepala Sekolah pada dasarnya berperan sebagai **penandatangan** (tanda tangan disiapkan di depan sebagai referensi cetak). Di SIPP, Kepala Sekolah **memvalidasi atau menolak setiap rapor secara digital** sebelum diterbitkan (lihat §7). Ini sengaja diperketat sebagai kontrol kualitas tambahan, mengingat rapor pesantren adalah dokumen baru yang belum punya jalur birokrasi sematang rapor mapel umum.
- SIPP tidak terhubung Dapodik dan tidak menarik/mengirim data siswa-guru dari sana — karena mapel plus tidak dilaporkan ke Dapodik. Data master diinput manual oleh admin sekolah.

## 7. Alur Rapor

Wali Kelas menyusun draft → mengajukan → Kepala Sekolah menyetujui/menolak → jika disetujui, Kepala Sekolah menerbitkan → siswa & orang tua bisa melihat rapor yang **Diterbitkan**.

Status: `Draft → Diajukan → Divalidasi / Ditolak → Diterbitkan`. Rapor yang **Ditolak** dikembalikan ke wali kelas untuk diperbaiki (nilai/deskripsi capaian/catatan) lalu diajukan ulang.

## 8. Kebutuhan Teknis (Awal)

**Hardware**
- Server/hosting untuk aplikasi web (MVP)
- Komputer/laptop client di ruang guru, tata usaha, operator sekolah
- Koneksi internet stabil
- Smartphone guru & orang tua (disiapkan untuk Phase 2 & 3)

**Software**
- OS: Windows/Linux (server), Android/iOS/Windows (client)
- Web browser modern (Chrome, Firefox, dll.)
- Backend: Laravel (PHP), REST API + token auth (Sanctum)
- Frontend: Next.js (React, TypeScript, Tailwind)
- Basis data relasional (MySQL) untuk data master, presensi, penilaian, dan rapor
- Text editor/IDE

> Stack konkret & detail environment ada di `AGENTS.md` (root repo) dan `docs/SETUP.md` — keduanya jadi acuan utama karena mengikuti kode yang berjalan.

## 9. Jadwal Pelaksanaan MVP

| No | Kegiatan | Waktu |
|---|---|---|
| 1 | Analisis kebutuhan & pengumpulan data | Minggu 1–2 |
| 2 | Perancangan sistem & basis data | Minggu 3–4 |
| 3 | Pengembangan MVP web (backend & frontend) | Minggu 5–9 |
| 4 | Pengujian aplikasi (testing) | Minggu 10–11 |
| 5 | Implementasi & pelatihan pengguna | Minggu 12 |
| 6 | Evaluasi MVP & penyusunan laporan akhir | Minggu 13–14 |

## 10. Tim

| Nama | Tugas | Uraian |
|---|---|---|
| Zakii Maulana Maalik | Analisis kebutuhan & desain sistem (backend) | Menyusun analisis kebutuhan, merancang basis data, mengembangkan backend |
| Andika Putra | Desain antarmuka & pengembangan frontend | Merancang UI dan mengembangkan frontend |

## 11. Status

📄 Fondasi arsitektur, alur data inti, dan sebagian besar modul MVP (§5) sudah diimplementasikan di `backend/` dan `frontend/` — lihat `AGENTS.md` (root) untuk detail stack dan perintah menjalankan proyek. Penyesuaian pola penilaian formatif/sumatif, predikat otomatis, dan deskripsi capaian pada §6 adalah **penyempurnaan yang direncanakan** di atas fondasi yang sudah ada, belum seluruhnya tercermin di skema database saat ini.

## 12. Referensi

Dokumen sumber: `Proposal SIPP – SMP Plus YPP Darussurur` (Zakii Maulana Maalik & Andika Putra, SMK Negeri 1 Cimahi, 2026).

Pola penilaian diselaraskan dengan referensi publik e-Rapor Kurikulum Merdeka (Direktorat SMP/SMA/SMK, Kemendikdasmen).