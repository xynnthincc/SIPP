# AGENTS.md — Panduan untuk AI Coding Agent

Dokumen ini berisi konteks dan aturan kerja bagi AI agent (mis. Claude Code, Copilot, Cursor, dll.) yang membantu mengembangkan **SIPP (Sistem Informasi Pembelajaran Pesantren) — MVP: E-Rapor Pesantren/Plus** untuk studi kasus SMP Plus YPP Darussurur. Baca berkas ini sebelum membuat atau mengubah kode.

## 1. Konteks Proyek

- Ini adalah proyek sekolah (mapel Produk Rekayasa Perangkat Lunak) berdasarkan proposal formal — lihat `README.md` untuk ringkasan lengkap.
- Fokus pengerjaan saat ini **hanya MVP berbasis web** (modul E-Rapor Pesantren/Plus). Jangan membangun fitur Phase 2 (mobile guru) atau Phase 3 (mobile orang tua) kecuali diminta eksplisit — cukup pastikan desain API/data tidak menutup kemungkinan integrasi mobile di kemudian hari.
- Sistem ini **tidak** menangani penilaian mata pelajaran umum (itu wilayah e-rapor pemerintah/Dapodik). Jangan membuat modul untuk itu.

## 2. Domain & Entitas Inti

Saat merancang skema data atau model, gunakan entitas berikut sebagai acuan:

- **Master**: Siswa, Guru (pesantren), Kelas/Rombel, Mata Pelajaran Plus, Tahun Ajaran, Semester
- **Operasional**: Jadwal aktivitas pesantren, Presensi, Assessment, Nilai, Catatan Guru, Progres Tahfidz/Tahsin
- **Pelaporan**: Rekap nilai, Rapor Pesantren (dengan alur persetujuan/approval), Export PDF
- **Akses**: Role & Permission (RBAC)

## 3. Role & Aturan Akses (wajib dipatuhi di setiap fitur baru)

| Role | Boleh melakukan |
|---|---|
| Admin/Operator | CRUD seluruh data master, atur tahun ajaran/semester, atur hak akses, backup data |
| Guru Pesantren | Input jadwal/presensi/assessment/nilai/catatan **hanya untuk siswa yang diampu**, dan **hanya selama periode penilaian masih dibuka** |
| Wali Kelas | Lihat rekap nilai & catatan siswa di kelas binaannya; ajukan rapor untuk validasi |
| Kepala Sekolah | Lihat rekap menyeluruh; validasi/approve rapor sebelum digenerate |
| Siswa | Lihat data miliknya sendiri saja (read-only) |
| Orang Tua/Wali | Lihat data anak yang terdaftar sebagai walinya saja (read-only) |

Setiap endpoint/fitur baru **harus** menegakkan batasan "kepemilikan data" di atas (guru hanya lihat siswa yang diampu, orang tua hanya lihat anaknya, dsb.), bukan hanya batasan role secara umum.

Alur rapor pesantren mengikuti urutan: **Guru input → Wali Kelas rekap & ajukan → Kepala Sekolah validasi/approve → Generate & export PDF**. Jangan izinkan generate rapor sebelum tahap validasi selesai.

## 4. Prinsip Desain

- **Periode penilaian**: sebagian besar data operasional (presensi, nilai, assessment) terikat pada tahun ajaran + semester yang sedang aktif/dibuka. Guru tidak boleh mengubah data pada periode yang sudah ditutup.
- **Auditability**: karena ini menggantikan pencatatan manual/spreadsheet, prioritaskan jejak audit (siapa mengisi/mengubah apa dan kapan) untuk presensi, nilai, dan catatan guru.
- **Siap untuk mobile**: API/backend sebaiknya dipisah dari frontend web (mis. REST/JSON API) karena Phase 2 & 3 akan mengonsumsi API yang sama dari aplikasi mobile.
- **Responsif**: UI web harus tetap dapat dipakai dari perangkat desktop maupun mobile (sesuai proposal), meski aplikasi mobile native menyusul di Phase 2/3.
- **Export**: fitur generate rapor harus menghasilkan output cetak/PDF yang rapi, bukan hanya tampilan layar.

## 5. Stack Teknis

Stack konkret **belum ditetapkan** di proposal asli. Jika belum ada keputusan lain dari tim/pengguna:
- Tanyakan preferensi bahasa/framework sebelum mulai coding jika belum pernah dibahas di repo ini.
- Jika sudah ada kode/konfigurasi di repository (mis. `package.json`, `composer.json`, `requirements.txt`), **ikuti stack yang sudah ada** — jangan memperkenalkan bahasa/framework baru tanpa alasan kuat.
- Pilih database relasional (mis. MySQL/PostgreSQL) sebagai default kerja karena data bersifat terstruktur dan relasional (siswa–kelas–nilai–rapor).

## 6. Yang Harus Dihindari

- Jangan membangun modul penilaian mata pelajaran umum atau integrasi Dapodik — di luar cakupan.
- Jangan melonggarkan pembatasan akses data demi kemudahan development (mis. "sementara semua role bisa lihat semua data") — ini data akademik/pribadi siswa.
- Jangan mengembangkan fitur Phase 2/3 (mobile) secara penuh di siklus MVP tanpa permintaan eksplisit; cukup jaga API tetap kompatibel.
- Jangan menghapus/mengubah alur approval rapor (guru → wali kelas → kepala sekolah) tanpa persetujuan pengguna.

## 7. Referensi

Detail lengkap latar belakang, rumusan masalah, tujuan, RAB, dan jadwal ada di `README.md` dan dokumen proposal asli (`XIIRPLC_35_ZakiiMaulanaMaalik_Proposal_SIPP_SMP_Darussurur.docx`).