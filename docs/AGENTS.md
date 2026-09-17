# AGENTS.md — SIPP

SIPP (Sistem Informasi Pembelajaran Pesantren), MVP E-Rapor Pesantren untuk SMP Plus YPP Darussurur (proyek sekolah PRPL). Monorepo 2 paket:
- `backend/` — Laravel REST API (PHP ^8.3, Laravel framework ^13.0, Sanctum)
- `frontend/` — Next.js 16 dashboard (App Router, React 19, TypeScript, Tailwind 4, axios)

Latar belakang & domain lengkap: `docs/README.md`. Setup terperinci: `docs/SETUP.md` — tapi lihat peringatan usang di bawah.

## Bahasa (konvensi wajib)
UI, pesan error/validasi API, dan komentar kode semuanya **Bahasa Indonesia**. Tulis kode fitur baru dengan bahasa yang sama.

## Stack — jangan ikuti docs yang usang
- `docs/SETUP.md` dan `docs/README.md` usang: masih menyebut Laravel 11 / Next.js 15 / Supabase (Postgres) dan "stack belum ditetapkan". Yang benar di `composer.json` / `package.json` / `.env`: **Laravel 13, Next.js 16, MySQL** (`DB_CONNECTION=mysql`, database `sipp`). Trust kode, bukan docs.
- Auth API = **token**: `POST /api/login` → `{ user, token }`; frontend menyimpan token di `localStorage` (`sipp_token`, `sipp_user`) dan mengirim `Authorization: Bearer`. Frontend `src/lib/api.ts` otomatis redirect `/login` saat 401. Jangan ubah ke cookie/session.
- Rapor API tanpa implementasi PDF: kolom `file_pdf` di tabel `rapors` sudah disiapkan tapi belum ada generatornya.

## Perintah

Backend (`backend/`):
```bash
composer install
cp .env.example .env && php artisan key:generate
php artisan migrate && php artisan db:seed   # butuh DB MySQL `sipp` aktif
php artisan serve                            # API di http://localhost:8000/api
vendor/bin/phpunit                           # test
vendor/bin/pint                              # formatting (laravel/pint)
```
Seeder membuat akun `admin@sipp.sch.id` / `password`, tahun ajaran 2026/2027 (aktif) + semester Ganjil (`penilaian_dibuka`), dan 5 mapel plus: Tahfidz, Tahsin, Kitab Kuning, Bahasa Arab, Akhlak.

Frontend (`frontend/`):
```bash
npm install
cp .env.local.example .env.local   # NEXT_PUBLIC_API_URL=http://localhost:8000/api
npm run dev                        # http://localhost:3000
npm run lint                       # eslint
npm run build                      # typecheck TS dijalankan Next saat build
```

## Role & akses data (wajib)
Ada 6 role (`User::ROLE_*`): `admin`, `guru_pesantren`, `wali_kelas`, `kepala_sekolah`, `siswa`, `orang_tua` — dipakai di kolom `role` user dan di redirect dashboard (`ROLE_HOME` di `frontend/src/lib/types.ts`).

- Semua route API di `backend/routes/api.php`, dikelompokkan dengan guard `->middleware('role:a,b')` (alias didaftarkan di `bootstrap/app.php` → `EnsureUserHasRole`).
- Setiap endpoint yang menampilkan data siswa **wajib discope kepemilikan**, bukan cuma role: guru → hanya siswa diampu; wali_kelas → siswa binaan (`wali_kelas_id` kelasnya); siswa → dirinya sendiri (`user_id`); orang_tua → anak terdaftar (relasi `anakWali` via pivot `siswa_wali`). Gunakan kembali trait `backend/app/Http/Controllers/Concerns/ScopesSiswaAccess.php` atau pola serupa. Jangan longgarkan demi kemudahan development.

## Alur rapor (jangan dilewati/ubah)
Draft → Diajukan (wali kelas) → Divalidasi/Ditolak (kepala sekolah) → Diterbitkan (kepala sekolah). Transisi status di-enforce dengan `abort_unless` di `RaporController` (mis. rapor hanya bisa divalidasi setelah Diajukan, hanya bisa diterbitkan setelah Divalidasi). Belum ada endpoint ekspor/PDF — saat dibangun, jadikan hanya tersedia untuk rapor berstatus Diterbitkan.

## Quirk struktur & penamaan
- Nama tabel non-default (cek migration/model sebelum menulis tabel baru): `siswas`, `gurus`, `kelas_rombels`, `mapel_plus`, `rapors`, `presensis`, `nilais`, `progres_hafalans`, `catatan_gurus`, pivot `siswa_wali`.
- Controller API di `backend/app/Http/Controllers/Api/`; model di `backend/app/Models/`.
- Frontend: rute per role di `frontend/src/app/<role>/`; tiap layout memakai `DashboardShell` dengan `allowedRoles` + `navItems`. Komponen UI shared di `src/components/ui/`.

## Batas scope (jangan dibangun tanpa diminta eksplisit)
- Hanya MVP web. Phase 2 (mobile guru) & 3 (mobile orang tua) belum masuk scope — jaga API tetap token/stateless agar bisa dipakai mobile nanti.
- Jangan buat modul penilaian mapel umum / integrasi Dapodik (di luar sistem, ditangani e-rapor pemerintah).
- DB default kerja: MySQL (relasional). Jangan perkenalkan framework/bahasa baru tanpa alasan kuat.