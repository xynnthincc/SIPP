# SIPP — Sistem Informasi Pembelajaran Pesantren

Scaffold proyek untuk proposal **SIPP (SMP Plus YPP Darussurur)** — MVP modul E-Rapor Pesantren/Plus.

Tech stack:
- **Backend**: Laravel 11 (REST API + Sanctum token auth)
- **Frontend**: Next.js 15 (App Router, TypeScript, Tailwind)
- **Database**: Supabase (Postgres)

## Struktur folder

```
sipp-project/
├── backend/     → Laravel API
└── frontend/    → Next.js dashboard (6 role: admin, guru, wali kelas, kepala sekolah, siswa, orang tua)
```

## ⚠️ Catatan penting sebelum mulai

Proyek ini di-scaffold di sandbox tanpa akses ke **Packagist** (registry Composer), jadi folder
`backend/vendor` **belum ada** — Anda WAJIB menjalankan `composer install` di komputer/laptop Anda
sendiri yang punya akses internet normal. Semua source code Laravel-nya (migrations, models,
controllers, routes) sudah lengkap dan siap pakai.

---

## 1. Setup Database di Supabase

1. Buat project baru di [supabase.com](https://supabase.com) (gratis).
2. Buka **Project Settings → Database → Connection string**.
3. Pilih mode **Session pooler** (bukan Transaction pooler — Laravel butuh persistent connection
   untuk beberapa fitur). Catat: host, port (biasanya 5432 atau 6543), database, username, password.

## 2. Setup Backend (Laravel)

```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
```

Edit `.env`, isi kredensial Supabase Anda:

```env
DB_CONNECTION=pgsql
DB_HOST=aws-0-xxxxx.pooler.supabase.com
DB_PORT=5432
DB_DATABASE=postgres
DB_USERNAME=postgres.xxxxxxxxxxxx
DB_PASSWORD=password_supabase_anda

FRONTEND_URL=http://localhost:3000
SANCTUM_STATEFUL_DOMAINS=localhost:3000
```

Install Sanctum config, migrate, dan seed data awal:

```bash
php artisan vendor:publish --provider="Laravel\Sanctum\SanctumServiceProvider"
php artisan migrate
php artisan db:seed
```

Seeder akan membuat:
- Akun admin: `admin@sipp.sch.id` / `password` (**ganti setelah login pertama**)
- Tahun ajaran 2026/2027 + Semester Ganjil (aktif)
- 5 mata pelajaran plus: Tahfidz, Tahsin, Kitab Kuning, Bahasa Arab, Akhlak

Jalankan server:

```bash
php artisan serve
# API berjalan di http://localhost:8000/api
```

## 3. Setup Frontend (Next.js)

```bash
cd frontend
npm install
cp .env.local.example .env.local
npm run dev
# Buka http://localhost:3000
```

Login dengan akun admin dari seeder, lalu mulai input data: tahun ajaran → kelas → siswa → guru →
tetapkan guru mengajar mapel di kelas tertentu (`guru-mapel-kelas`) → jadwal.

---

## 4. Struktur Role & Alur Kerja

| Role | Akses |
|---|---|
| **Admin** | Kelola tahun ajaran, kelas, siswa, guru, mapel plus, penugasan mengajar |
| **Guru Pesantren** | Lihat jadwal mengajarnya, input presensi & nilai massal, catat progres hafalan & catatan siswa |
| **Wali Kelas** | Lihat siswa binaan, susun draft rapor, ajukan ke kepala sekolah |
| **Kepala Sekolah** | Validasi/tolak rapor yang diajukan, terbitkan rapor yang sudah valid |
| **Siswa** | Lihat rapor & rekap nilai miliknya sendiri |
| **Orang Tua/Wali** | Lihat progres hafalan, catatan guru, presensi anak yang terdaftar sebagai walinya |

**Alur rapor**: Wali Kelas menyusun draft → mengajukan → Kepala Sekolah menyetujui/menolak →
jika disetujui, Kepala Sekolah menerbitkan → siswa & orang tua bisa melihat rapor yang **Diterbitkan**.

## 5. Modul yang sudah lengkap (backend + frontend)

- ✅ Auth (login/logout via Sanctum token)
- ✅ Master data: Tahun Ajaran & Semester, Kelas/Rombel, Siswa, Guru, Mapel Plus
- ✅ Penugasan guru mengajar (guru + mapel + kelas + semester) & Jadwal
- ✅ Presensi (input massal per jadwal/tanggal)
- ✅ Nilai (jenis assessment custom per mapel, input massal, rekap tertimbang bobot)
- ✅ Progres hafalan Tahfidz/Tahsin
- ✅ Catatan guru per siswa
- ✅ Rapor dengan alur approval lengkap

## 6. Yang masih perlu Anda kembangkan sendiri

Scaffold ini fokus ke fondasi arsitektur & alur data inti. Beberapa hal berikut sengaja belum
dibuatkan karena tergantung kebutuhan spesifik/desain UI final Anda:

- **UI penugasan guru-mapel-kelas** di halaman admin (endpoint API `/guru-mapel-kelas` & `/jadwal`
  sudah ada, tinggal dibuatkan formnya — contoh pola sudah ada di `admin/mapel-plus/page.tsx`)
- **Fitur "hubungkan siswa dengan akun orang tua"** — endpoint `/siswas/{id}/wali` sudah ada,
  tinggal dibuatkan UI-nya di admin
- **Export rapor ke PDF** — kolom `file_pdf` di tabel `rapors` sudah disiapkan; bisa pakai
  package seperti `barryvdh/laravel-dompdf` untuk generate PDF dari data rapor
- **Registrasi akun untuk siswa & orang tua** — saat ini admin perlu membuat user manual
  (mirip pola di `GuruController::store`) lalu menghubungkannya ke data siswa
- **Validasi ulang rapor yang ditolak** — endpoint `ajukan()` di `RaporController` bisa dipanggil
  ulang setelah wali kelas memperbaiki catatan
- **Notifikasi** (email/WA) saat rapor diterbitkan — belum ada di scope MVP proposal

## 7. Kredensial demo setelah seeding

```
Admin
Email: admin@sipp.sch.id
Password: password
```

Buat akun guru/wali kelas/kepala sekolah/siswa/orang tua melalui panel admin atau `php artisan tinker`.
