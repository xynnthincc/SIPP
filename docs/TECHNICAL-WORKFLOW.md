# Technical Workflow — SIPP (Backend ke Frontend)

Dokumen ini menjelaskan **alur teknis nyata** dari kode sumber: bagaimana setiap request berjalan mulai dari klik pengguna di browser, melewati layer frontend, dikirim ke API Laravel, diproses, dan hasilnya dikembalikan ke UI.

---

## 1. Arsitektur Tingkat Tinggi

```
┌──────────────────────────────────────────────────────────────────┐
│                     Browser (Next.js 16)                         │
│                                                                  │
│  AuthProvider (React Context)                                    │
│    └─ sipp_token + sipp_user di localStorage                     │
│                                                                  │
│  api.ts (Axios Instance)                                         │
│    └─ interceptor REQUEST  → sisipkan Authorization: Bearer {t}  │
│    └─ interceptor RESPONSE → 401 → hapus token, redirect /login  │
│                                                                  │
│  DashboardShell (layout guard)                                   │
│    └─ cek user.role, redirect /login jika tidak sesuai          │
└────────────────────────┬─────────────────────────────────────────┘
                         │  HTTPS  JSON
                         ▼
┌──────────────────────────────────────────────────────────────────┐
│                   Laravel 13 REST API                            │
│                                                                  │
│  routes/api.php                                                  │
│    └─ middleware('auth:sanctum')   → validasi Bearer token       │
│    └─ middleware('role:x,y,z')    → EnsureUserHasRole            │
│                                                                  │
│  Controller → Support class → Eloquent Model → MySQL             │
│                                                                  │
│  Response: JSON (200/201/204/422/403/401)                        │
└──────────────────────────────────────────────────────────────────┘
```

---

## 2. Alur Autentikasi (Login → Token → Redirect)

### 2.1 Diagram Sequence Login

```mermaid
sequenceDiagram
    actor U as Pengguna
    participant FE as "LoginPage (Next.js)"
    participant AC as "AuthContext (auth-context.tsx)"
    participant API as "api.ts (Axios)"
    participant BE as "AuthController (Laravel)"
    participant DB as MySQL

    U->>FE: Isi email & password, klik "Masuk"
    FE->>AC: login(email, password)
    AC->>API: POST /api/login
    API->>BE: HTTP POST /api/login
    BE->>DB: Auth::attempt(credentials)
    DB-->>BE: User row
    BE->>BE: Cek is_active, buat Sanctum token
    BE-->>AC: 200 { user, token, punya_penugasan_guru }
    AC->>AC: Simpan token & user ke localStorage
    AC->>FE: router.push berdasarkan ROLE_HOME[user.role]
    note over FE: admin → /admin, guru → /guru, wali_kelas → /wali-kelas, dst.
```

### 2.2 Detail Kode Kunci

**Backend — `AuthController@login`:**
```php
$token = $user->createToken('sipp-token')->plainTextToken;

return response()->json([
    'user'  => array_merge($user->toArray(), [
        // Flag ini disisipkan langsung agar sidebar frontend sinkron tanpa fetch tambahan
        'punya_penugasan_guru' => (bool)($user->guru && $user->guru->guruMapelKelas()->exists()),
    ]),
    'token' => $token,
]);
```

**Frontend — `AuthContext.login()`:**
```ts
async function login(email: string, password: string) {
    const { data } = await api.post("/login", { email, password });
    localStorage.setItem("sipp_token", data.token);
    localStorage.setItem("sipp_user", JSON.stringify(data.user));
    setUser(data.user);
    router.push(ROLE_HOME[data.user.role] ?? "/");
}
```

**Frontend — `api.ts` (Axios interceptors):**
```ts
// Request: inject token ke setiap request
api.interceptors.request.use((config) => {
    const token = localStorage.getItem("sipp_token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

// Response: auto-logout jika token expired/invalid
api.interceptors.response.use(
    (res) => res,
    (err) => {
        if (err.response?.status === 401) {
            localStorage.removeItem("sipp_token");
            localStorage.removeItem("sipp_user");
            window.location.href = "/login";
        }
        return Promise.reject(err);
    }
);
```

---

## 3. Pipeline Request API (Setiap Endpoint Terautentikasi)

```mermaid
flowchart LR
    A["api.ts: axios.get/post"] -->|"+ Authorization: Bearer"| B["routes/api.php"]
    B --> C{"middleware\nauth:sanctum"}
    C -->|Token invalid| D[401 Unauthorized]
    C -->|Token valid| E{"middleware\nrole:x,y"}
    E -->|Role tidak cocok| F[403 Forbidden]
    E -->|Role cocok| G[Controller Method]
    G --> H["Request::validate()"]
    H -->|Gagal| I[422 Unprocessable]
    H -->|Lulus| J["Business Logic + Query"]
    J --> K[MySQL]
    K --> J
    J --> L["abort_unless (scope check)"]
    L -->|Ownership gagal| M[403 Forbidden]
    L -->|Lulus| N["200 JSON Response"]
    N --> O["Frontend render / toast"]
```

### 3.1 Dua Lapis Penjagaan Akses

| Layer | Lokasi | Contoh |
| :--- | :--- | :--- |
| **Layer 1 — Role** | `middleware('role:...')` di `api.php` | Hanya `admin,wali_kelas` yang bisa POST `/deskripsi-capaian` |
| **Layer 2 — Ownership** | `abort_unless(...)` di dalam Controller | Wali kelas hanya bisa akses kelas binaannya, bukan kelas lain |

Contoh kode `RaporController@pastikanBolehCetak`:
```php
$boleh = $user->hasRole('admin', 'kepala_sekolah')
    || ($user->hasRole('wali_kelas') && $siswa->kelasUntukSemester($semester)?->wali_kelas_id === $user->id)
    || ($user->hasRole('siswa')      && $siswa->user_id === $user->id)
    || ($user->hasRole('orang_tua')  && $siswa->wali()->where('users.id', $user->id)->exists());

abort_unless($boleh, 403, 'Anda tidak berhak mencetak rapor ini.');
```

---

## 4. Alur Input Nilai Guru (End-to-End Lengkap)

Kasus: **Guru menginput nilai massal seluruh siswa satu kelas**.

```mermaid
sequenceDiagram
    actor G as Guru
    participant UI as "/guru/nilai"
    participant API as api.ts
    participant C as NilaiDiniyahController
    participant DB as MySQL

    G->>UI: Pilih kelas & mapel
    UI->>API: GET /nilai-diniyah/massal?mapel_plus_id=&kelas_rombel_id=&semester_id=
    API->>C: daftarMassal()
    C->>DB: SELECT nilai_mapels WHERE mapel+kelas+semester
    DB-->>C: Nilai existing
    C-->>UI: [{siswa_id, nama, nis, nilai, kkm}]
    UI->>UI: Tampilkan matriks nilai prefilled

    G->>UI: Ubah nilai, klik "Simpan"
    UI->>API: POST /nilai-diniyah/massal { mapel_plus_id, kelas_rombel_id, semester_id, nilai:[...] }
    API->>C: simpanMassal()
    C->>C: Cek semester.penilaian_dibuka
    C->>C: pastikanBolehNilaiMassal - guru harus mengampu mapel di kelas tsb
    C->>C: Verifikasi semua siswa terdaftar di kelas
    loop tiap siswa
        C->>DB: NilaiMapel.updateOrCreate(...)
        C->>DB: LogEditNilai.updateOrCreate(...)
    end
    C-->>UI: 200 { message: "Nilai akhir berhasil disimpan." }
    UI->>UI: Tampilkan toast sukses
```

---

## 5. Alur Generasi Rapor Real-Time (On-The-Fly)

Rapor **tidak disimpan** di database sebagai dokumen. Setiap cetak = kompilasi data terkini.

```mermaid
sequenceDiagram
    actor WK as Wali Kelas
    participant UI as "/rapor-cetak"
    participant API as api.ts
    participant RC as RaporController
    participant ND as "NilaiDiniyah (Support)"
    participant DB as MySQL

    WK->>UI: Pilih siswa & semester, klik cetak
    UI->>API: GET /rapor/cetak?siswa_id=&semester_id=
    API->>RC: cetak()
    RC->>RC: pastikanBolehCetak - role + scope
    RC->>RC: komposisiCetak(siswa, semester)

    par Ambil nilai mapel
        RC->>ND: nilaiPerMapel(siswa_id, semester_id)
        ND->>DB: SELECT nilai_mapels (nilai langsung)
        ND->>DB: SELECT nilais + jenis_assessments (asesmen berbobot)
        ND->>ND: Return: langsung ?? agregat sumatif
    and Ambil kehadiran
        RC->>DB: COUNT DISTINCT tanggal per status dari presensis
        note over DB: Fallback ke kehadiran_rekaps jika kosong
    and Ambil data pendukung
        RC->>DB: NilaiPraktik, Pembiasaan, Sikap, Sekolah
        RC->>RC: hitungPeringkat - sort avg nilai sekelas
    end

    RC->>RC: ArabBilangan::angkaArab + terbilangArab
    RC-->>UI: 200 { sekolah, siswa, kelas, mapel[], total, rata2, peringkat, praktik[], dst. }
    UI->>UI: Render HTML rapor dwibahasa Arab-Latin
    UI->>UI: window.print() + CSS page-break per rapor
```

### 5.1 Formula Nilai Efektif (`NilaiDiniyah::nilaiPerMapel`)

```php
// Langkah 1: Ambil nilai langsung dari tabel nilai_mapels
$langsung = NilaiMapel::where('siswa_id', $siswaId)
    ->where('semester_id', $semesterId)
    ->pluck('nilai', 'mapel_plus_id');

// Langkah 2: Hitung agregat dari asesmen berbobot (UH, Tugas, UTS, UAS)
$agregat = Nilai::with('jenisAssessment')
    ->where('siswa_id', $siswaId)->where('semester_id', $semesterId)->get()
    ->groupBy(fn($n) => $n->jenisAssessment->mapel_plus_id)
    ->map(function($items) {
        $sumatif = $items->filter(fn($n) => $n->jenisAssessment->kategori === 'sumatif');
        $bobot   = $sumatif->sum(fn($n) => $n->jenisAssessment->bobot);
        return $bobot > 0
            ? round($sumatif->sum(fn($n) => $n->nilai * $n->jenisAssessment->bobot) / $bobot)
            : null;
    });

// Langkah 3: Prioritas — nilai langsung menimpa agregat
return $idMapel->mapWithKeys(fn($id) => [$id => $langsung->get($id) ?? $agregat->get($id)]);
```

---

## 6. Session Management & Routing Guard di Frontend

### 6.1 Hirarki Komponen

```
app/layout.tsx
  └─ <AuthProvider>                     ← Context global (token, user, login, logout)
       └─ /admin/layout.tsx             ← layout per role
            └─ <DashboardShell allowedRoles={["admin"]} navItems={[...]} navGroups={[...]}>
                 └─ children (konten halaman)
```

**`auth-context.tsx`** — Saat mount, baca `localStorage` dan set state `user`. Fungsi `login()` dan `logout()` mengubah state + localStorage + redirect.

### 6.2 Guard Halaman di `DashboardShell`

```ts
useEffect(() => {
    if (loading) return;                        // Tunggu baca localStorage selesai
    if (!user) { router.replace("/login"); return; }
    if (!allowedRoles.includes(user.role)) {    // Role tidak cocok → redirect
        router.replace("/login");
    }
}, [user, loading, allowedRoles, router]);
```

### 6.3 Sidebar Adaptif — Wali Kelas Merangkap Guru

```mermaid
flowchart TD
    A["DashboardShell mount"] --> B["useRoleNav(user)"]
    B --> C{"user.punya_penugasan_guru?"}
    C -->|"true (dari /login atau /me)"| D["Render: Grup Wali Kelas + Grup Guru Mapel"]
    C -->|false atau undefined| E["Fetch background /pengampuan-saya"]
    E --> F{Ada penugasan?}
    F -->|Ya| G["Update state → tambah Grup Guru Mapel"]
    F -->|Tidak| H["Sidebar: hanya menu Wali Kelas"]
    D & G & H --> I["Sidebar final tanpa flicker"]
```

> **Kenapa tidak flicker?** Flag `punya_penugasan_guru` sudah disisipkan di response `/login` dan `/me` sehingga sidebar render sinkron. Fetch `/pengampuan-saya` hanya sebagai revalidasi background.

---

## 7. Middleware `EnsureUserHasRole` (Backend)

```php
// Registrasi alias di bootstrap/app.php
$middleware->alias(['role' => EnsureUserHasRole::class]);

// Pemakaian di routes/api.php
Route::middleware('role:admin,wali_kelas')->group(function () {
    Route::get('/nilai-diniyah/export', [NilaiDiniyahController::class, 'export']);
});

// Implementasi — simple, tanpa package RBAC eksternal
class EnsureUserHasRole {
    public function handle(Request $request, Closure $next, string ...$roles) {
        $user = $request->user();
        if (!$user || !$user->hasRole(...$roles)) {
            return response()->json(['message' => 'Anda tidak memiliki akses.'], 403);
        }
        return $next($request);
    }
}

// hasRole di User model — strict, tidak ada wildcard/hierarki
public function hasRole(string ...$roles): bool {
    return in_array($this->role, $roles, true);
}
```

---

## 8. Alur Export Excel (Axios Blob + PhpSpreadsheet)

```mermaid
sequenceDiagram
    actor WK as Wali Kelas
    participant UI as RaporCetakList
    participant API as "api.ts (axios)"
    participant C as NilaiDiniyahController
    participant SS as PhpSpreadsheet
    participant DB as MySQL

    WK->>UI: Klik "Export Excel"
    UI->>API: GET /nilai-diniyah/export { responseType: "blob" }
    note over UI,API: Harus pakai axios blob agar token Bearer tetap terkirim di header. Link HTML biasa tidak bisa.
    API->>C: export()
    C->>C: Cek role (wali_kelas = kelas binaan, admin = semua kelas)
    C->>DB: Ambil siswa + nilai efektif semua mapel per semester
    C->>C: Sort siswa A-Z, hitung total, rata-rata, ranking
    C->>SS: Buat Spreadsheet (NIS, Nama, Nilai per Mapel, Total, Rata, Ranking)
    SS-->>C: Binary .xlsx
    C-->>API: response()->streamDownload() Content-Type xlsx
    API-->>UI: Blob
    UI->>UI: URL.createObjectURL(blob) + a.click() = file ter-download
```

---

## 9. Alur Push Notifikasi FCM (Catatan Guru → Orang Tua)

```mermaid
sequenceDiagram
    actor G as Guru
    participant C as CatatanGuruController
    participant PS as PushService
    participant DB as "MySQL (notifications)"
    participant FCM as Firebase FCM HTTP v1
    participant HP as HP Orang Tua

    G->>C: POST /catatan-guru { siswa_id, catatan }
    C->>DB: INSERT catatan_gurus
    C->>PS: notify(user_id=ortu, judul, isi)
    PS->>DB: INSERT notifications (selalu tersimpan)
    PS->>DB: SELECT device_tokens WHERE user_id = ortu
    alt FCM_PROJECT_ID dikonfigurasi di .env
        PS->>FCM: POST googleapis.com/fcm/v1/.../messages:send via OAuth2 JWT
        FCM-->>HP: Push notification muncul di HP
    else Tidak dikonfigurasi (dev/lokal)
        note over PS: Push dilewati, notifikasi tetap ada di DB
    end
    C-->>G: 201 catatan berhasil disimpan
```

---

## 10. Ringkasan Semua Lapisan Teknis

| Layer | Teknologi & File | Tanggung Jawab |
| :--- | :--- | :--- |
| **Routing Frontend** | Next.js App Router (`/src/app/*`) | URL per role, page component, layout hierarki |
| **State Auth** | React Context `auth-context.tsx` | Simpan user & token, fungsi login/logout, redirect role |
| **HTTP Client** | Axios `api.ts` | Base URL, inject Bearer token, auto-redirect 401 |
| **Guard UI** | `DashboardShell.tsx` | Proteksi halaman per role, sidebar navigasi adaptif |
| **Sidebar Adaptif** | `useRoleNav()` di `nav.ts` | Menu beda per role, wali kelas + guru tanpa flicker |
| **API Routing** | `routes/api.php` | Daftar endpoint + grup middleware role |
| **Auth Guard** | Sanctum `auth:sanctum` | Validasi Bearer token di setiap request |
| **Role Guard** | `EnsureUserHasRole.php` | Cek `user.role` vs izin route, kembalikan 403 jika gagal |
| **Business Logic** | Controller + `NilaiDiniyah.php` (Support) | Validasi, scope ownership, hitung nilai efektif, rapor |
| **ORM & Database** | Eloquent + MySQL | Query, relasi model, `updateOrCreate`, riwayat nilai historis |
| **Notifikasi** | `PushService.php` + FCM HTTP v1 | Simpan notif ke DB + kirim push ke HP |
| **Export Dokumen** | PhpSpreadsheet | Generate `.xlsx` nilai per kelas dengan ranking otomatis |
| **Render Rapor** | Blade + Browsershot | HTML dwibahasa Arab-Latin, opsional PDF via Puppeteer |
