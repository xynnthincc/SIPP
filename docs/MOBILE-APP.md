# MOBILE-APP.md — Blueprint Aplikasi SIPP (Kotlin Multiplatform)

Dokumen ini jadi acuan pembuatan aplikasi mobile SIPP di **repo terpisah**. Backend
memakai Laravel API yang sudah ada di repo ini (token/stateless).

## Tujuan & Pendekatan

Aplikasi bukan sekadar port web. Fokus MVP mobile:

1. **Push notifikasi + catatan guru ke orang tua** — timeline anak (feed) + notif instan.
2. **Izin digital** — ortu ajukan izin → wali kelas setujui/tolak → ortu dapat notif.
3. **Akun siswa: rapor share PDF + biodata** — buka rapor, share ke WA/email.

## Stack

- **Kotlin Multiplatform + Compose Multiplatform** (target awal: **Android**; iOS menyusul).
- **Ktor Client** + `kotlinx.serialization` untuk konsumsi REST API.
- Auth token Sanctum (Bearer), disimpan di secure storage (DataStore/EncryptedSharedPrefs).
- Push: **FCM** (Android). iOS menyusul via APNs.
- PDF rapor: digenerate **di server** (Browsershot) lalu diunduh & di-share dari app.

## Arsitektur

```
KMP App (Android dulu)
  commonMain : Ktor + serialization, auth token, model, viewmodel, Compose UI
  androidMain: FCM service, share sheet, file download, deep link
        │  Authorization: Bearer <token>
        ▼
Laravel API (repo ini)  →  MySQL
        │
        └─ FCM HTTP v1 (PushService) ──► perangkat
```

Base URL: `http://<host>:8000/api` (dev: `http://10.0.2.2:8000/api` untuk emulator Android).

## Kontrak API (dipakai app)

Semua butuh `Authorization: Bearer {token}` kecuali login.

### Auth
| Method | Path | Keterangan |
|---|---|---|
| POST | `/login` | `{ email, password }` → `{ user, token }` |
| POST | `/logout` | cabut token |
| GET | `/me` | profil user aktif |

### Notifikasi & perangkat
| Method | Path | Keterangan |
|---|---|---|
| GET | `/notifications?unread_only=&per_page=` | list notifikasi (paginated: `data`, `total`) |
| POST | `/notifications/{id}/read` | tandai satu dibaca |
| POST | `/notifications/read-all` | tandai semua dibaca |
| POST | `/device-token` | `{ platform: android\|ios\|web, token }` → 201 |
| DELETE | `/device-token` | `{ token }` saat logout |

Notifikasi yang dikirim saat ini: `catatan_guru`, `izin_baru`, `izin_status`.
Field respons: `id, type, title, body, url, payload, read_at, created_at`.

### Catatan guru (writer)
| Method | Path | Keterangan |
|---|---|---|
| GET | `/catatan-guru?siswa_id=` | list (ortu wajib isi `siswa_id`) |
| POST | `/catatan-guru` | role `guru_pesantren,admin`; multipart dukung `lampiran` (jpg/png/pdf/mp3/m4a/mp4/webm ≤15MB) |

### Izin digital
| Method | Path | Keterangan |
|---|---|---|
| GET | `/izin?status=&all=` | scoped per role (ortu→anak, siswa→diri, wali_kelas→kelas, admin/kepala→semua) |
| POST | `/izin` | role `orang_tua,admin`; `{ siswa_id, jenis, tanggal_mulai, tanggal_selesai, alasan, lampiran? }` |
| POST | `/izin/{id}/status` | role `wali_kelas,admin`; `{ status: disetujui\|ditolak, catatan? }` |

### Rapor & biodata
| Method | Path | Keterangan |
|---|---|---|
| GET | `/rapor/cetak?siswa_id=&semester_id=` | data rapor (JSON, utk UI) |
| GET | `/rapor/pdf?siswa_id=&semester_id=` | dokumen rapor (`text/html` atau `application/pdf`) → share |
| GET | `/siswa/{siswa}` | biodata lengkap |
| POST | `/siswas/{siswa}/foto` | role `admin,wali_kelas`; multipart `foto` (avatar) |

### Penunjang
`GET /semester`, `GET /tahun-ajaran`, `GET /kelas-rombel`, `GET /siswa`, `GET /mapel-plus`,
`GET /praktik-item`, `GET /progres-hafalan`, `GET /presensi`, `GET /nilai`,
`GET /nilai-diniyah/rekap?siswa_id=&semester_id=`, `GET /sekolah`.

> Catatan: endpoint index di-scope per role di controller, bukan di route. Jangan
> asumsikan akses dari nama path.

## Model data baru (backend)

- `notifications` — `id, user_id, type, title, body, url, payload(json), read_at, timestamps`
- `device_tokens` — `id, user_id, platform, token(unique), meta(json), last_used_at`
- `izins` — `id, siswa_id, jenis, tanggal_mulai, tanggal_selesai, alasan, lampiran, status(pending|disetujui|ditolak), catatan, diajukan_oleh, disetujui_oleh, disetujui_waktu`
- `catatan_gurus.lampiran` — kolom baru (nullable)

## Layar per role (MVP)

- **Orang tua**
  - Timeline anak: feed catatan guru + progres hafalan + status izin (per anak).
  - Ajukan izin (form + lampiran) & riwayat izin anak.
  - Rapor anak: preview + tombol **Share** (unduh `/rapor/pdf` → share sheet WA/email).
  - Inbox notifikasi.
- **Wali kelas**
  - Daftar izin pending kelas binaan → setujui/tolak (+catatan).
  - Detail siswa binaan + rapor.
- **Guru pesantren**
  - Tulis catatan (dengan foto/audio) untuk siswa diampu.
  - Input presensi/nilai (menyusul bila perlu).
- **Siswa**
  - Rapor saya + biodata + notifikasi.
- **Admin/kepala sekolah** — tetap fokus web; app bisa read-only (menyusul).

## Push notification (FCM) — setup

1. Backend `backend/.env`:
   ```
   FCM_PROJECT_ID=xxxx
   FCM_SERVICE_ACCOUNT=D:\path\ke\service-account.json
   RAPOR_PDF_DRIVER=html   # ganti "chrome" utk PDF server-side
   ```
2. App: dapatkan token FCM → `POST /api/device-token` setelah login; `DELETE` saat logout.
3. Backend `PushService` mengirim HTTP v1 (OAuth2 JWT). **Jika env kosong, push dilewati,
   notifikasi tetap tersimpan di DB** — app tetap bisa menampilkan inbox.
4. Tap notifikasi → baca `payload.url` → deep link ke layar terkait
   (mis. `/ortu/progres-anak`, `/wali-kelas/izin`).

## PDF rapor

- Driver `html` (default): endpoint mengembalikan HTML; app render di WebView lalu
  print-to-PDF / share. Tidak butuh dependensi tambahan.
- Driver `chrome`: backend pakai Spatie Browsershot (butuh node + puppeteer:
  `composer require spatie/browsershot` dan `npx puppeteer browsers install chrome`).
  Mengembalikan `application/pdf` — app cukup unduh + share.

## Struktur repo KMP (saran)

```
sipp-mobile/
  composeApp/
    src/commonMain/kotlin/...   # networking, model, viewmodel, UI
    src/androidMain/kotlin/...  # FCM, share, file, deep link
  gradle/ , settings.gradle.kts , build.gradle.kts
  local.properties (sdk.dir)
  README.md (setup + base URL)
```

## Roadmap

1. **Fase 1 (MVP)**: auth, push + inbox, timeline anak (ortu), tulis catatan (guru), izin digital, rapor share PDF.
2. **Fase 2**: presensi & input nilai dari HP, avatar/kegiatan + upload foto, offline queue.
3. **Fase 3**: iOS, QR presensi, pengumuman broadcast, komunikasi wali kelas.

## Verifikasi backend

```bash
cd backend
php artisan migrate
vendor/bin/phpunit --filter="NotifikasiIzinTest|RaporPdfTest"
vendor/bin/pint
php artisan storage:link   # wajib agar file upload bisa diakses
```
