# SIPP — Sistem Informasi Pembelajaran Pesantren

**MVP: E-Rapor Pesantren/Plus (Berbasis Web)**
Studi kasus: **SMP Plus YPP Darussurur**

Proyek Produk Rekayasa Perangkat Lunak — Konsentrasi Keahlian Rekayasa Perangkat Lunak, SMK Negeri 1 Cimahi (2026).

Disusun oleh:
- Andika Putra (NIS: 241117867) — Desain antarmuka & pengembangan frontend
- Zakii Maulana Maalik (NIS: 241117901) — Analisis kebutuhan, desain sistem & pengembangan backend

---

## 1. Latar Belakang

SMP Plus YPP Darussurur adalah sekolah berbasis pesantren yang memadukan kurikulum nasional dengan pembelajaran kepesantrenan (Tahfidz, Tahsin, Kitab Kuning, Bahasa Arab, Akhlak). Penilaian mata pelajaran umum sudah difasilitasi oleh e-rapor resmi pemerintah (terhubung Dapodik), sehingga **di luar cakupan proyek ini**.

Namun seluruh proses pembelajaran kepesantrenan — penjadwalan, presensi, penilaian, pencatatan progres Tahfidz/Tahsin, catatan guru, hingga rapor pesantren — masih dilakukan manual/semi-manual (buku catatan & spreadsheet terpisah antar guru). Hal ini menyebabkan rekap data lambat, rawan salah input, progres santri sulit dipantau berkelanjutan, dan orang tua baru mengetahui hasil belajar saat pembagian rapor per semester.

## 2. Tujuan

1. Membangun SIPP untuk mengelola data master, jadwal, presensi, penilaian, dan rapor pesantren secara terpusat, dimulai dari **MVP berbasis web** (modul E-Rapor Pesantren/Plus).
2. Mempercepat proses input presensi, assessment, nilai, catatan guru, serta rekap nilai hingga penerbitan rapor.
3. Menyediakan akses pemantauan bagi orang tua/wali (Tahfidz/Tahsin, nilai, presensi, catatan guru) pada tahap lanjutan (mobile).
4. Menyusun roadmap pengembangan bertahap: MVP web → aplikasi mobile guru → aplikasi mobile orang tua.

## 3. Roadmap Pengembangan

| Tahap | Platform | Fokus | Fitur Utama |
|---|---|---|---|
| **MVP** (proyek ini) | Web | E-Rapor Pesantren/Plus | Master siswa, master guru, kelas/rombel, mata pelajaran plus, aktivitas pesantren, jadwal, presensi, assessment, nilai, catatan guru, rekap nilai, generate rapor, export/print PDF, tahun ajaran & semester, role & permission |
| Phase 2 | Mobile Guru | Operasional harian | Jadwal hari ini, presensi, quick assessment, input nilai, catatan siswa, progress Tahfidz/Tahsin, notifikasi |
| Phase 3 | Mobile Orang Tua | Monitoring progres siswa | Progress anak, nilai pesantren, Tahfidz, Tahsin, presensi, catatan guru, notifikasi, rapor digital |

Proposal dan repository ini berfokus pada **MVP**; Phase 2 & 3 adalah roadmap lanjutan setelah MVP berjalan dan dievaluasi.

## 4. Pengguna & Hak Akses (Role)

| Level Akun | Kewenangan |
|---|---|
| **Admin/Operator Sekolah** | Mengelola seluruh data master, tahun ajaran/semester, mengatur hak akses pengguna lain, backup data |
| **Guru Pesantren** | Mengisi jadwal, presensi, assessment, nilai, dan catatan untuk siswa yang diampu selama periode penilaian dibuka |
| **Wali Kelas** | Melihat rekap nilai & catatan seluruh siswa binaannya, mengajukan rapor pesantren untuk validasi |
| **Kepala Sekolah** | Melihat rekap menyeluruh, memvalidasi/menyetujui rapor pesantren sebelum digenerate |
| **Siswa** | Melihat nilai dan rapor pesantren milik sendiri |
| **Orang Tua/Wali** | Melihat nilai dan rapor pesantren anak yang terdaftar sebagai walinya (akses penuh pada Phase 3) |

> Guru mata pelajaran umum **bukan** pengguna sistem ini, karena penilaiannya sudah difasilitasi e-rapor pemerintah/Dapodik.

## 5. Ruang Lingkup MVP

Modul yang dibangun pada tahap MVP (web):
- Data master: siswa, guru, kelas/rombel, mata pelajaran plus, tahun ajaran & semester
- Aktivitas pesantren & penjadwalan
- Presensi
- Assessment & penilaian
- Progres Tahfidz/Tahsin
- Catatan guru
- Rekap nilai & alur persetujuan (guru → wali kelas → kepala sekolah)
- Generate & export/print rapor pesantren (PDF)
- Role & permission (RBAC) sesuai tabel di atas

## 6. Kebutuhan Teknis (Awal)

**Hardware**
- Server/hosting untuk aplikasi web (MVP)
- Komputer/laptop client di ruang guru, tata usaha, operator sekolah
- Koneksi internet stabil
- Smartphone guru & orang tua (disiapkan untuk Phase 2 & 3)

**Software**
- OS: Windows/Linux (server), Android/iOS/Windows (client)
- Web browser modern (Chrome, Firefox, dll.)
- Bahasa pemrograman & framework backend/frontend (ditentukan tim pengembang saat implementasi)
- Basis data untuk data master, presensi, penilaian, dan rapor
- Text editor/IDE

> Stack teknis konkret (bahasa, framework, database) belum ditetapkan di proposal awal dan akan didokumentasikan begitu diputuskan — lihat `AGENTS.md` untuk panduan bagi kontributor/agent pengembangan.

## 7. Jadwal Pelaksanaan MVP

| No | Kegiatan | Waktu |
|---|---|---|
| 1 | Analisis kebutuhan & pengumpulan data | Minggu 1–2 |
| 2 | Perancangan sistem & basis data | Minggu 3–4 |
| 3 | Pengembangan MVP web (backend & frontend) | Minggu 5–9 |
| 4 | Pengujian aplikasi (testing) | Minggu 10–11 |
| 5 | Implementasi & pelatihan pengguna | Minggu 12 |
| 6 | Evaluasi MVP & penyusunan laporan akhir | Minggu 13–14 |

## 8. Tim

| Nama | Tugas | Uraian |
|---|---|---|
| Zakii Maulana Maalik | Analisis kebutuhan & desain sistem (backend) | Menyusun analisis kebutuhan, merancang basis data, mengembangkan backend |
| Andika Putra | Desain antarmuka & pengembangan frontend | Merancang UI dan mengembangkan frontend |

## 9. Status

📄 Proyek masih pada tahap **proposal/perencanaan**. Kode sumber, skema basis data, dan struktur repository belum dibuat — dokumen ini menjadi acuan awal sebelum implementasi dimulai.

## 10. Referensi

Dokumen sumber: `Proposal SIPP – SMP Plus YPP Darussurur` (Zakii Maulana Maalik & Andika Putra, SMK Negeri 1 Cimahi, 2026).