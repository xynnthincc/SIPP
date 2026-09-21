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

## Alur rapor (revisi besar — ikuti e-rapor lama)
Rapor adalah **cetakan real-time dari data nilai**, TANPA status/validasi/penerbitan (mengikuti alur aplikasi lama `e-rapor-plus`):
- `GET /api/rapor/cetak?siswa_id=&semester_id=` — komposisi cetak dihitung on-the-fly (nilai mapel efektif, praktik, pembiasaan, sikap, kehadiran, peringkat kelas, predikat). Semester default: yang aktif.
- Yang boleh cetak: admin & kepala sekolah (semua siswa), wali kelas (siswa binaannya), siswa (dirinya), orang tua (anaknya). **Guru pesantren tidak boleh cetak** (403).
- `GET /api/rapor/progres?semester_id=&kelas_rombel_id=` — indikator kelengkapan nilai per siswa (mapel/praktik terisi, pembiasaan/sikap/kehadiran). Akses: admin, kepala sekolah, wali kelas (scoped kelasnya). Progres hanyalah indikator, BUKAN gerbang cetak.
- Nilai boleh direvisi kapan pun (selama `penilaian_dibuka`); rapor selalu menampilkan data terbaru. Tabel & model `rapors` sudah dihapus.

## Rapor sementara (wadah tengah semester)
- `semesters.jenis` enum `Akhir`|`Sementara` (default `Akhir`; migrasi `2026_09_21_000001`). Satu tahun ajaran boleh punya "Ganjil Akhir" + "Ganjil Sementara" berdampingan — duplikat kombinasi nama+jenis dalam satu TA ditolak 422 (`SemesterController@store/update`).
- Wadah Sementara = **wadah nilai terpisah**: semua input (nilai mapel/praktik, pembiasaan, sikap, kehadiran) tetap di-scope `semester_id` seperti biasa — guru/wali memilih semester "(Sementara)" saat menginput. TA baru tetap auto-create Ganjil/Genap jenis Akhir; wadah Sementara dibuat manual admin dari halaman Tahun Ajaran.
- Rapor wadah Sementara: format & hak akses sama dengan rapor akhir (real-time, tanpa biodata — biodata tetap halaman cetak terpisah). Web: judul kop "LAPORAN SEMENTARA" + baris "( PENILAIAN TENGAH SEMESTER )", identitas semester tampil "Ganjil (Sementara)". PDF server (`pdf/rapor.blade.php`): "Laporan Hasil Belajar — SEMENTARA".
- Frontend: penandaan wadah Sementara di semua dropdown memakai `labelSemester()` (`frontend/src/lib/semester.ts`); payload rapor (`/rapor/cetak` & `/rapor/pdf`) menyertakan `semester.jenis`.

## Export Excel daftar nilai (wali kelas)
`GET /api/nilai-diniyah/export?semester_id=` (route `role:wali_kelas,admin`):
- Wali kelas → otomatis kelas binaannya (tanpa parameter kelas); admin wajib kirim `kelas_rombel_id`. Guru & lainnya 403.
- File `.xlsx` dibuat `PhpOffice\PhpSpreadsheet` (dependensi composer): kolom NIS, nama, 1 kolom per mapel (nilai efektif = langsung ?? agregasi sumatif), total, rata-rata (total / jumlah mapel), ranking — baris terurut ranking terbaik; total sama = ranking sama.
- Frontend: tombol "Export Excel" di `RaporCetakList` (mode wali kelas), unduh via axios `responseType: "blob"` lalu `URL.createObjectURL` (token ada di header, link biasa tidak bisa).

## Input nilai guru (asesmen OPSIONAL)
Dua jalur input nilai guru mapel, keduanya berujung ke rapor yang sama:
- **Nilai akhir langsung** (default yang disarankan): `POST /api/nilai-diniyah/massal` `{mapel_plus_id, kelas_rombel_id, semester_id, nilai:[{siswa_id, nilai}]}` → menulis `nilai_mapels` (nilai langsung). Halaman `/guru/nilai` mode "Nilai Akhir Langsung" (prefill via `GET /nilai-diniyah/massal`).
- **Per asesmen** (opsional): `POST /api/nilai/massal` per jenis assessment; nilai akhir mapel = rata-rata tertimbang bobot asesmen sumatif.
- **Prioritas nilai efektif** (dipakai rapor cetak, progres, export, rekap): `langsung ?? agregat sumatif` (`App\Support\NilaiDiniyah::nilaiPerMapel`). Nilai langsung menimpa perhitungan asesmen; dikosongkan (null) → kembali ke perhitungan asesmen.
- **Korelasi wali kelas**: nilai yang diinput guru mapel langsung terlihat di rekap wali (`GET /nilai-diniyah/rekap`) kolom "Nilai" + "Nilai Akhir" (label "dari asesmen" bila turunan perhitungan).
- Scope `nilai-diniyah/massal` (GET & POST): guru harus mengampu mapel tsb di kelas tsb semester itu; wali kelas hanya kelas binaannya; admin bebas. Siswa harus terdaftar di kelas tsb. `penilaian_dibuka` di-enforce.
- Jenis assessment per mapel (`mapel_plus_id`). Seeder `JenisAssessmentSeeder` membuat default UH/Tugas/UTS/UAS (sumatif @25%) — jalankan `php artisan db:seed` ulang bila mapel baru ditambahkan.

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

## Notifikasi, Izin Digital, Upload, Rapor PDF (module aplikasi mobile)

Backend konsumsi aplikasi mobile (KMP repo terpisah) — tetap token/stateless:

- **Notifikasi**: tabel `notifications` (custom, bukan bawaan Laravel) + `device_tokens`. `App\Services\PushService` menyimpan baris DB **dan** mengirim push FCM bila dikonfigurasi (HTTP v1 + OAuth2 JWT dari service account; `config/services.php` `fcm`). Env: `FCM_PROJECT_ID`, `FCM_SERVICE_ACCOUNT` (path absolut JSON). Jika kosong → push dilewati, notifikasi tetap tersimpan di DB (aman untuk dev/test).
- Endpoint semuanya role login: `GET/POST/PATCH... /api/notifications`, `POST /api/notifications/read-all`, `POST /api/notifications/{id}/read`, `POST|DELETE /api/device-token`.
- Pemicu notif saat ini: catatan guru dibuat (`catatan_gurus` → ortu anak), izin diajukan (`izins` → wali kelas), izin ditanggapi (→ pengaju). Tambahkan `app(Services\PushService::class)->notify(...)` di tempat lain sesuai kebutuhan.
- **Izin digital**: tabel `izins`. `GET /api/izin` discope per role di controller (ortu→anak, siswa→diri, wali_kelas→kelas binaan, admin/kepala→semua). `POST /api/izin` (role `orang_tua,admin`) mendukung field `lampiran` (file). `POST /api/izin/{izin}/status` (role `wali_kelas,admin`) body `status: disetujui|ditolak` (+`catatan`, opsional).
- **Upload**: file disimpan `Storage::disk('public')` (jalankan `php artisan storage:link`), path di kolom `foto` / `lampiran`. `POST /api/siswas/{siswa}/foto` (role `admin,wali_kelas`) upload avatar siswa.
- **Rapor PDF**: `GET /api/rapor/pdf?siswa_id=&semester_id=` — hak akses sama dengan `/rapor/cetak`. Driver `services.rapor.pdf_driver`: `html` (default, kembalikan HTML Blade `resources/views/pdf/rapor.blade.php`) atau `chrome` (PDF via Spatie Browsershot + node/puppeteer; fallback HTML bila package/node tidak ada). Env: `RAPOR_PDF_DRIVER`.
- Note: `User` TIDAK lagi memakai trait `Notifiable` (digantikan relasi `notifications()` custom). Aplikasi KMP repo terpisah belum dibuat.

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

## Alur rapor — lihat bagian "Alur rapor" di atas (real-time, tanpa validasi)

## Quirk struktur & penamaan
- Nama tabel non-default (cek migration/model sebelum menulis tabel baru): `siswas`, `gurus`, `kelas_rombels`, `mapel_plus`, `rapors`, `presensis`, `nilais`, `progres_hafalans`, `catatan_gurus`, pivot `siswa_wali`.
- Controller API di `backend/app/Http/Controllers/Api/`; model di `backend/app/Models/`.
- Frontend: rute per role di `frontend/src/app/<role>/`; tiap layout memakai `DashboardShell` dengan `allowedRoles` + `navItems`. Komponen UI shared di `src/components/ui/`.

## Batas scope (jangan dibangun tanpa diminta eksplisit)
- Hanya MVP web. Phase 2 (mobile guru) & 3 (mobile orang tua) belum masuk scope — jaga API tetap token/stateless agar bisa dipakai mobile nanti.
- Jangan buat modul penilaian mapel umum / integrasi Dapodik (di luar sistem, ditangani e-rapor pemerintah).
- DB default kerja: MySQL (relasional). Jangan perkenalkan framework/bahasa baru tanpa alasan kuat.