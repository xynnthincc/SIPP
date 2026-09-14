# SIPP — Sistem Informasi Pembelajaran Pesantren

Scaffold proyek untuk proposal **SIPP (SMP Plus YPP Darussurur)** — MVP modul E-Rapor Pesantren/Plus.

Tech stack (sesuai `composer.json` / `package.json` / `.env` — lihat `AGENTS.md` root untuk detail):
- **Backend**: Laravel 13 (REST API + Sanctum token auth), PHP ^8.3
- **Frontend**: Next.js 16 (App Router, React 19, TypeScript, Tailwind 4)
- **Database**: MySQL (`DB_CONNECTION=mysql`, database `sipp`)

## Struktur folder

```
sipp-project/
├── backend/     → Laravel API
└── frontend/    → Next.js dashboard (6 role: admin, guru_pesantren, wali_kelas, kepala_sekolah, siswa, orang_tua)
```

## 1. Setup Backend (Laravel)

```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
```

Isi `.env` dengan koneksi MySQL lokal Anda:

```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=sipp
DB_USERNAME=root
DB_PASSWORD=

FRONTEND_URL=http://localhost:3000
```

Migrate & seed data awal:

```bash
php artisan migrate
php artisan db:seed
```

Seeder akan membuat:
- Akun admin: `admin@sipp.sch.id` / `password` (**ganti setelah login pertama**)
- Tahun ajaran 2026/2027 + Semester Ganjil (aktif, `penilaian_dibuka`)
- 5 mata pelajaran plus: Tahfidz, Tahsin, Kitab Kuning, Bahasa Arab, Akhlak

Jalankan server:

```bash
php artisan serve
# API berjalan di http://localhost:8000/api
```

## 2. Setup Frontend (Next.js)

```bash
cd frontend
npm install
cp .env.local.example .env.local   # NEXT_PUBLIC_API_URL=http://localhost:8000/api
npm run dev
# Buka http://localhost:3000
```

Login dengan akun admin dari seeder, lalu mulai input data: tahun ajaran → kelas → siswa → guru →
tetapkan guru mengajar mapel di kelas tertentu (`guru-mapel-kelas`) → jadwal.

---

## 3. Struktur Role & Alur Kerja

| Role | Akses |
|---|---|
| **Admin** | Kelola tahun ajaran, kelas, siswa, guru, mapel plus, penugasan mengajar, buka/tutup periode penilaian |
| **Guru Pesantren** | Lihat jadwal mengajarnya, input presensi & nilai massal (formatif & sumatif), catat progres hafalan & catatan siswa |
| **Wali Kelas** | Lihat siswa binaan, susun draft rapor, lengkapi deskripsi capaian per mapel, ajukan ke kepala sekolah |
| **Kepala Sekolah** | Validasi/tolak rapor yang diajukan, terbitkan rapor yang sudah valid |
| **Siswa** | Lihat rapor & rekap nilai miliknya sendiri |
| **Orang Tua/Wali** | Lihat progres hafalan, catatan guru, presensi anak yang terdaftar sebagai walinya |

### Alur penilaian (per mapel plus, per semester)

Mengikuti pola e-rapor resmi (Kurikulum Merdeka), assessment dibedakan dua tipe:

1. **Formatif** — nilai latihan/proses (mis. latihan setoran harian yang belum final). Tercatat di sistem, terlihat guru & wali kelas, tapi **tidak** ikut dihitung ke nilai akhir.
2. **Sumatif** — nilai yang menentukan capaian (mis. Ujian Tengah Semester, Ujian Akhir Semester, Setoran Resmi). Setiap jenis sumatif punya bobot (%); nilai akhir mapel = rata-rata tertimbang seluruh nilai sumatif siswa pada semester itu.

Nilai akhir angka lalu dikonversi otomatis ke **predikat** berdasarkan rentang yang dikonfigurasi admin, contoh:

| Rentang nilai | Predikat |
|---|---|
| 90–100 | Sangat Baik |
| 75–89 | Baik |
| 60–74 | Cukup |
| < 60 | Perlu Bimbingan |

Progres Tahfidz/Tahsin tetap memakai skala kualitatif tersendiri (Lancar / Perlu Perbaikan / Mengulang), karena sifatnya bukan nilai ujian tapi capaian hafalan berjalan.

### Alur rapor

Wali Kelas menyusun draft (nilai akhir + predikat per mapel ditarik otomatis, lalu wali kelas melengkapi **deskripsi capaian** naratif per mapel dan catatan wali kelas) → **mengajukan** →
Kepala Sekolah **menyetujui/menolak** → jika disetujui, Kepala Sekolah **menerbitkan** → siswa & orang tua bisa melihat rapor yang **Diterbitkan**.

Status: `Draft → Diajukan → Divalidasi / Ditolak → Diterbitkan`. Rapor berstatus **Ditolak** bisa diperbaiki wali kelas dan diajukan ulang (panggil ulang endpoint `ajukan()`).

> **Catatan:** validasi digital per rapor oleh Kepala Sekolah ini sengaja **lebih ketat** dibanding pola e-rapor pemerintah (di sana Kepala Sekolah pada dasarnya hanya penandatangan cetak, bukan approval per siswa). Ini keputusan desain untuk kontrol kualitas rapor pesantren, bukan penyimpangan yang perlu "diluruskan".

## 4. Modul yang sudah lengkap (backend + frontend)

- ✅ Auth (login/logout via Sanctum token)
- ✅ Master data: Tahun Ajaran & Semester, Kelas/Rombel, Siswa, Guru, Mapel Plus
- ✅ Penugasan guru mengajar (guru + mapel + kelas + semester) & Jadwal
- ✅ Presensi (input massal per jadwal/tanggal, status Hadir/Sakit/Izin/Alpa)
- ✅ Nilai (jenis assessment custom per mapel, input massal, rekap tertimbang bobot)
- ✅ Progres hafalan Tahfidz/Tahsin
- ✅ Catatan guru per siswa
- ✅ Rapor dengan alur approval lengkap (Draft → Diajukan → Divalidasi/Ditolak → Diterbitkan)

## 5. Penyempurnaan yang masih perlu dikembangkan (belum ada di skema saat ini)

Bagian di §3 tentang formatif/sumatif, predikat, dan deskripsi capaian adalah **desain target**, bukan yang sudah berjalan. Supaya alurnya benar-benar semirip pola resmi, ini perubahan konkret yang perlu dibuat:

- **Kolom `tipe` di `jenis_assessments`** — enum `formatif` / `sumatif`, default `sumatif` (migration baru + update `JenisAssessmentController`).
- **Perhitungan nilai akhir hanya dari nilai sumatif** — di `NilaiController::rekapSiswa()`, filter `$nilais` supaya hanya assessment bertipe `sumatif` yang masuk kalkulasi `nilai_akhir`; nilai formatif tetap dikembalikan terpisah di response (mis. key `formatif`) untuk ditampilkan sebagai riwayat proses, tanpa memengaruhi angka akhir.
- **Konversi predikat** — helper/accessor (mis. di `Nilai` model atau service kecil) yang memetakan `nilai_akhir` ke label predikat berdasarkan rentang yang bisa dikonfigurasi admin (tabel referensi baru atau config sederhana).
- **Kolom deskripsi capaian per mapel per rapor** — tabel baru (mis. `rapor_mapel_deskripsis`: `rapor_id`, `mapel_plus_id`, `deskripsi`) diisi wali kelas saat menyusun draft, ditampilkan di rapor cetak per mapel.
- **UI penugasan guru-mapel-kelas** di halaman admin (endpoint API `/guru-mapel-kelas` & `/jadwal` sudah ada, tinggal dibuatkan formnya — contoh pola sudah ada di `admin/mapel-plus/page.tsx`).
- **Fitur "hubungkan siswa dengan akun orang tua"** — endpoint `/siswas/{id}/wali` sudah ada, tinggal dibuatkan UI-nya di admin.
- **Export rapor ke PDF** — kolom `file_pdf` di tabel `rapors` sudah disiapkan tapi belum ada generatornya; bisa pakai `barryvdh/laravel-dompdf`, sertakan predikat & deskripsi capaian di template cetak, dan hanya aktifkan untuk rapor berstatus **Diterbitkan**.
- **Registrasi akun untuk siswa & orang tua** — saat ini admin perlu membuat user manual (mirip pola di `GuruController::store`) lalu menghubungkannya ke data siswa.
- **Notifikasi** (email/WA) saat rapor diterbitkan — belum ada di scope MVP proposal.

## 6. Kredensial demo setelah seeding

```
Admin
Email: admin@sipp.sch.id
Password: password
```

Buat akun guru/wali kelas/kepala sekolah/siswa/orang tua melalui panel admin atau `php artisan tinker`.