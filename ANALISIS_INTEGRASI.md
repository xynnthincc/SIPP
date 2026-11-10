# Analisis Integrasi — SIPP Web (E-Rapor) × SIPP Mobile (Nilai Harian)

> Konteks: dokumen ini merangkum hasil reverse engineering aplikasi mobile (Kotlin
> Multiplatform / Compose) dan patch minimal yang dipasang agar mobile **benar-benar
> terintegrasi** dengan backend produksi SIPP, dengan **nol perubahan perilaku** pada
> aplikasi web yang sudah stabil. Dipersiapkan untuk **demo**, bukan rilis final.

---

## 1. Peran Tiap Aplikasi (pembagian yang jelas)

| | **Web (sipp-project)** | **Mobile (repo ini)** |
|---|---|---|
| Fungsi utama | **E-Rapor**: input nilai rapor (nilai akhir), data master (mapel, kelas, siswa, jadwal, pengampu), kelola rapor/predikat/dll | **Aplikasi guru lapangan**: input nilai harian per asesmen (UH/Tugas/UTS/UAS...) + presensi per slot jadwal |
| Target pengguna | Admin, wali kelas, guru (desktop) | Guru pesantren / pengampu (hp, cepat, di lokasi) |
| Data yang ditulis | `nilai_mapels` (nilai akhir langsung), master data | `nilai` (per jenis assessment) + `presensi` (per jadwal & tanggal) |
| Data yang dibaca | Menampilkan rapor; **otomatis agregasi** nilai harian jika nilai langsung kosong | Daftar pengampuan, siswa, asesmen, nilai eksisting, jadwal |

**Prinsip:** web tetap bisa dipakai *pure e-rapor* (guru isi nilai akhir langsung, tanpa
sentuh nilai harian). Mobile hanya *menambah* sumber data harian. Tidak ada rombakan.

---

## 2. Temuan Reverse Engineering (sebelum patch)

1. **Absensi mobile tidak pernah tersimpan di server.** Mobile POST ke
   `absensi` (404) → fallback `presensi` (405) → fallback terakhir
   *menganggap sukses* dan hanya menyimpan cache di memori. Data hilang diam-diam.
2. **Default BASE_URL masih `127.0.0.1:8000`** — aplikasi tidak bisa hit server produksi.
3. **Tanggal presensi hard-coded `2026-10-28`** — tidak dinamis.
4. **Prefill nilai memakai `GET /nilai?semester_id`** — menarik seluruh nilai semester
   (semua kelas/asesmen) lalu difilter di client. Payload besar & boros.
5. **`TokenStore` hanya `mutableMapOf`** (in-memory): token & pengaturan server tidak
   persisten antar restart aplikasi. (Dibiarkan apa adanya untuk demo; lihat §7.)
6. Dead code: `simpanNilaiAkhirLangsung`, `getNilaiDiniyahMassal`, `getPredikatRange`
   tidak dipanggil screen manapun (dibiarkan, tidak dihapus agar diff minimal).

## 3. Patch yang Dipasang (semuanya additive, tidak mengubah jalur web)

### Backend web (sipp-project, commit `fb2b9f4`)
- `GET /api/nilai` mendapat **filter opsional** `jenis_assessment_id` &
  `kelas_rombel_id` (via `whereHas siswa`). Tanpa parameter, perilaku endpoint
  **tidak berubah sama sekali** (rekap web masih pakai bentuk lama).

### Mobile
- `data/ApiConfig.kt` — default `BASE_URL` →
  `https://api-sipp.smpplusdarussururcimahi.sch.id` (produksi; `/api` ditambahkan
  otomatis oleh `SippApi.url()`). Dialog "Server" di layar login tetap bisa override
  untuk development lokal.
- `data/models/SippModels.kt` — tambah `PresensiServerItem`, `JadwalItem` (+`labelSlot`),
  `GuruMapelKelasItem`.
- `data/SippApi.kt` —
  - `getNilai(semesterId, jenisAssessmentId? = null, kelasRombelId? = null)`;
  - `getJadwalSaya()` → `GET /jadwal` (backend sudah meng-scope ke guru login);
  - `getPresensiByJadwal(jadwalId, tanggal)` → `GET /presensi?jadwal_id=&tanggal=`;
  - `simpanPresensiMassal(jadwalId, tanggal, items)` → `POST /presensi/massal`
    `{jadwal_id, tanggal, presensi: [{siswa_id, status (Hadir/Sakit/Izin/Alpa), keterangan}]}` —
    **tanpa fake success tiap koneksi**: exception ditampilkan
    di banner error layar.
- `screens/AbsensiScreen.kt` — flow presensi diganti ke **per-slot jadwal** (model data
  backend yang asli): memuat slot jadwal pengampuan (mapel+kelas), chip pemilih slot
  di bar atas, prefill status dari server per slot+tanggal, konfirmasi menampilkan
  label slot, tanggal default dinamis. Warning jelas bila mapel belum punya slot
  jadwal ("buat jadwal dulu di web").
- `screens/InputNilaiScreen.kt` — prefill nilai memakai filter baru (payload kecil).
- `Platform.kt` + 4 file `Platform.*.kt` — `tanggalHariIni(): String` via
  expect/actual (yyyy-MM-dd zona perangkat) menggantikan hard-code / kotlinx-datetime
  (kotlinx-datetime dihapus dari dependensi karena bermasalah di toolchain ini).
- `shared/build.gradle.kts` — tanpa perubahan dependensi (net-zero kembali ke original).

---

## 4. Endpoint yang Dipakai Mobile (semua tersedia & berlaku di produksi)

| Kebutuhan | Endpoint | Catatan |
|---|---|---|
| Autentikasi | `POST /login`, `GET /me`, `POST /logout` | Sanctum token |
| Semester | `GET /semester` | pilih semester aktif |
| Pengampuan guru | `GET /pengampuan-saya` | mapel + kelas rombel |
| Asesmen | `GET /jenis-assessment?mapel_plus_id=` | bobot & kategori (sumatif/formatif) |
| Siswa per kelas | `GET /siswa?kelas_rombel_id=&page=N` | client loop pagination |
| Prefill nilai harian | `GET /nilai?semester_id=&jenis_assessment_id=&kelas_rombel_id=` | *filter baru* |
| Simpan nilai harian | `POST /nilai/massal` | per jenis assessment |
| Slot jadwal guru | `GET /jadwal` | dasar presensi (hari/jam) |
| Baca presensi | `GET /presensi?jadwal_id=&tanggal=` | |
| Simpan presensi | `POST /presensi/massal` | role: guru_pesantren/wali_kelas/admin |

## 5. Logic Akumulasi: Nilai Harian → Nilai Rapor

Implementasi final ada di backend web: `app/Support/NilaiDiniyah.php`
(`nilaiPerMapel()`) dan dipakai tampilan rapor (`RaporController`, dll). Rulenya
sederhana dan **berlaku untuk semua mapel diniyah per siswa per semester**:

```
nilai_akhir(mapel, siswa, semester) =
    nilai_mapels.nilai        ← guru isi LANGSUNG via web (pure e-rapor)
    ?? agregasi_sumatif       ← fallback otomatis dari nilai harian
```

**Agregasi sumatif** — hanya dari nilai harian (tabel `nilai`, input via mobile):

```
agregasi(P) = round( Σ(nilai_as × bobot_as) / Σ(bobot_as) )
              untuk as = jenis assessment berkategori "sumatif"
            = NULL jika Σ bobot = 0 (belum ada data sumatif)
```

- **Formatif tidak ikut dihitung** — hanya melatih/bimbingan.
- Contoh: UH1=80 (bobot 1), UH2=90 (bobot 1), UTS=85 (bobot 2) →
  (80+90+85×2) / 4 = 85.
- Jika guru mengisi `nilai_mapels.nilai` di web, nilai itu **menang** dan nilai
  harian otomatis diabaikan — sebaliknya rapor memakai agregasi ini.
- Tampilan `daftarNilaiMapel()` juga mengembalikan `kkm` efektif untuk tabel predikat.

**Presensi** tidak masuk nilai: disimpan di tabel `presensi` per **slot jadwal +
tanggal**; rekap kehadiran dibaca per jadwal/tanggal oleh web (wali kelas).

## 6. Alur Demo (terukur, end-to-end)

1. **Web (login admin/wali kelas):** pastikan mapel+kelas sudah punya **slot jadwal**
   (Jadwal & Pengampu) dan **jenis assessment** dengan bobot (mis. UH bb 1, UTS bb 2).
   *Opsional:* biarkan nilai akhir mapel kosong dulu agar efek agregasi terlihat.
2. **Mobile (login guru yang sama):**
   - Pilih semester (aktif) → pengampuan (mapel+kelas).
   - **PilihAsesmen** → pilih UH → **InputNilai** → isi nilai tiap santri → simpan
     (menuju `POST /nilai/massal`; prefill nilai lama otomatis via filter baru).
   - **Absensi** → pilih slot jadwal (chip) → tandai H/S/I/A → simpan (menuju
     `POST /presensi/massal`; slot tanpa jadwal → pesan perbaikan yang jelas).
3. **Web (rapor siswa terkait):** buka rapor/nilai mapel → nilai harian tampil
   sebagai nilai akhir hasil agregasi (bobot-weighted sumatif), presensi tampil
   di rekap.
4. **Pure e-rapor (buktikan skenario lama tetap aman):** di web isi nilai akhir
   mapel tersebut → rapor langsung pakai nilai itu (agregasi harian diabaikan).
   *Tidak ada perubahan struktur data/flow yang diperlukan.* 🎯

## 7. Catatan Rilis / Rekomendasi Lanjutan (di luar scope demo)

- **Persistensi sesi**: ganti `TokenStore` in-memory ke `multiplatform-settings`
  (dependensi sudah ada di `shared`), atau `EncryptedSharedPreferences` di Android.
- **Role gating**: screen mobile belum memfilter role (siswa/orang tua bisa login,
  tapi endpoint guru akan 403) — sembunyikan kartu fitur sesuai `user.roleLabel`.
- **Bersih-bersih**: hapus dead code (`simpanNilaiAkhirLangsung`,
  `getNilaiDiniyahMassal`, `getPredikatRange`, `simpanAbsensi/getAbsensi` lama) dan
  sisa dependensi tak terpakai.
- **Deploy mobile**: untuk demo cukup **APK debug lokal**; rilis bisa milestone
  (mungkin PWA/wasm) — status mengikuti keputusan user; mobile belum masuk CI.
- **Keamanan & QA**: rate-limit login mobile, refresh token / logout-all device,
  tes fisik perangkat, error i18n.

## 8. Status Build & Verifikasi (per dokumen ini dibuat)

- Backend web: pint bersih, **106/106 tests hijau**, commit `fb2b9f4` di-push ke
  `main` (deploy Hostinger otomatis).
- Mobile: kompilasi `commonMain` metadata, js, wasmJs, iosSimulatorArm64, dan
  `:androidApp:assembleDebug` (APK demo) — lihat commit patch di branch
  `integrasi-demo` (lokal; jangan push ke branch `mobile` milik owner tanpa
  koordinasi).
