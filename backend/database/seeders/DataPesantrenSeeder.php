<?php

namespace Database\Seeders;

use App\Models\Guru;
use App\Models\GuruMapelKelas;
use App\Models\Jadwal;
use App\Models\KelasRombel;
use App\Models\MapelPlus;
use App\Models\PraktikItem;
use App\Models\Sekolah;
use App\Models\Semester;
use App\Models\Siswa;
use App\Models\TahunAjaran;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class DataPesantrenSeeder extends Seeder
{
    /**
     * Sebelas mata pelajaran plus sesuai kurikulum pesantren (revisi client).
     * nama_ar/kelompok/kkm_default/urutan bisa diubah di menu admin (mapel-plus).
     */
    private const MAPELS = [
        ['kode' => 'QURAN', 'nama' => 'Al-Qur\'an', 'nama_ar' => 'القرآن', 'kelompok' => 'tahfidz', 'kkm_default' => 75, 'urutan' => 1],
        ['kode' => 'BAGDADY', 'nama' => 'Qaidah Baghdadiyah', 'nama_ar' => 'قاعدة بغدادية', 'kkm_default' => 70, 'urutan' => 2],
        ['kode' => 'FIQIH', 'nama' => 'Fiqih', 'nama_ar' => 'الفقه', 'kkm_default' => 70, 'urutan' => 3],
        ['kode' => 'TAUHID', 'nama' => 'Tauhid', 'nama_ar' => 'التوحيد', 'kkm_default' => 70, 'urutan' => 4],
        ['kode' => 'AKHLAK', 'nama' => 'Akhlaq', 'nama_ar' => 'الأخلاق', 'kelompok' => 'akhlak', 'kkm_default' => 70, 'urutan' => 5],
        ['kode' => 'NAHWU', 'nama' => 'Nahwu', 'nama_ar' => 'النحو', 'kelompok' => 'kitab_kuning', 'kkm_default' => 70, 'urutan' => 6],
        ['kode' => 'SHOROF', 'nama' => 'Shorof', 'nama_ar' => 'الصرف', 'kelompok' => 'kitab_kuning', 'kkm_default' => 70, 'urutan' => 7],
        ['kode' => 'TAJWID', 'nama' => 'Tajwid', 'nama_ar' => 'التجويد', 'kkm_default' => 70, 'urutan' => 8],
        ['kode' => 'TARIKH', 'nama' => 'Tarikh', 'nama_ar' => 'التاريخ', 'kkm_default' => 70, 'urutan' => 9],
        ['kode' => 'BHS_ARAB', 'nama' => 'Bahasa Arab', 'nama_ar' => 'اللغة العربية', 'kelompok' => 'bahasa_arab', 'kkm_default' => 60, 'urutan' => 10],
        ['kode' => 'HADITS', 'nama' => 'Hadits', 'nama_ar' => 'الحديث', 'kelompok' => 'kitab_kuning', 'kkm_default' => 70, 'urutan' => 11],
    ];

    /**
     * Item praktik & hafalan (urutan mencerminkan baris rapor). Admin bisa
     * tambah/hapus lewat menu "Praktik & Hafalan".
     */
    private const PRAKTIK_ITEMS = [
        ['kode' => 'WUDHU_SHALAT', 'nama_id' => 'Wudhu dan Shalat', 'nama_ar' => 'الوضوء والصلاة', 'urutan' => 1],
        ['kode' => 'JUZ_AMMA', 'nama_id' => 'Hafalan Juz Amma', 'nama_ar' => 'جزء عمّ', 'urutan' => 2],
        ['kode' => 'HADITS', 'nama_id' => 'Hafalan Hadits', 'nama_ar' => 'محفوظات الحديث', 'urutan' => 3],
        ['kode' => 'SAFINAH', 'nama_id' => 'Pembacaan Kitab Safinah', 'nama_ar' => 'قراءة كتاب سفينة النجاة', 'urutan' => 4],
        ['kode' => 'TIJAN', 'nama_id' => 'Pembacaan Kitab Tijan', 'nama_ar' => 'قراءة كتاب تيجان الدراري', 'urutan' => 5],
    ];

    /**
     * Guru: key = kode singkat (dipakai assignment & jadwal), wali_kelas => nama kelas
     * yang diwalikan (null = bukan wali kelas), mengajar => daftar [mapel => kelas].
     */
    private const GURUS = [
        'YAHYA' => ['nama' => 'MUHAMMAD YAHYA', 'wali_kelas' => '7A'],
        'ZARKASIH' => ['nama' => 'MUHAMAD ZARKASIH', 'wali_kelas' => '7B'],
        'RODHIAH' => ['nama' => 'ROMDHONIAH RODHIAH', 'wali_kelas' => '7C', 'mengajar' => ['Shorof' => ['8C', '8D', '9C']]],
        'JUAIRIYAH' => ['nama' => 'JUAIRIYAH', 'wali_kelas' => '7D', 'mengajar' => ['Hadits' => ['7C', '7D', '8C', '8D', '9C']]],
        'ABDURROQIB' => ['nama' => 'MUHAMMAD ABDURROQIB DS', 'wali_kelas' => '8A'],
        'MUHYI' => ['nama' => 'MUHAMMAD ABDUL MUHYI', 'wali_kelas' => '8B'],
        'HAFSAH' => ['nama' => 'HAFSAH WAHBIYAH', 'wali_kelas' => '8C', 'mengajar' => ['Akhlaq' => ['7C', '7D', '8C', '8D', '9C']]],
        'KHOLISOH' => ['nama' => 'SITI SARAH KHOLISOH', 'wali_kelas' => '8D', 'mengajar' => ['Fiqih' => ['7C', '7D', '8C', '8D', '9C']]],
        'HAKIM' => ['nama' => 'LUKMANUL HAKIM', 'wali_kelas' => '9A'],
        'NAHROWI' => ['nama' => 'AHMAD NAHROWI', 'wali_kelas' => '9B', 'mengajar' => ['Akhlaq' => ['7A', '7B']]],
        'NISFAH' => ['nama' => 'SITI NISFAH SA\'BANIAH', 'wali_kelas' => '9C', 'mengajar' => ['Tauhid' => ['7C', '7D', '8C', '8D', '9C']]],
        'ISKANDAR' => ['nama' => 'K.H. MUHAMMAD ISKANDAR DJULQORNAEN', 'mengajar' => ['Nahwu' => ['9A', '9B']]],
        'JAMALUDIN' => ['nama' => 'M. JAMALUDIN', 'mengajar' => ['Akhlaq' => ['8B', '9C']]],
        'ZARKASI' => ['nama' => 'MUHAMMAD YUSUFE ZARKASI (CIBADUYUT)', 'mengajar' => ['Nahwu' => ['8A', '8B'], 'Shorof' => ['9A', '9B']]],
        'ANIQOTUL' => ['nama' => 'ANIQOTUL UMMAH', 'mengajar' => ['Nahwu' => ['8C', '8D', '9C'], 'Al-Qur\'an' => ['9C']]],
        'MARYAM' => ['nama' => 'SITI MARYAM', 'mengajar' => ['Qaidah Baghdadiyah' => ['7C']]],
        'IBNU' => ['nama' => 'IBNU MUHAJAR', 'mengajar' => ['Qaidah Baghdadiyah' => ['7A', '7B']]],
        'SARIFAH' => ['nama' => 'SARIFAH', 'mengajar' => ['Qaidah Baghdadiyah' => ['7D']]],
    ];

    /**
     * Jadwal mapel plus semester Ganjil 2026/2027 — hasil ekstraksi sheet GANJIL,
     * hanya sel yang (mapel, kelas)-nya punya guru pengampu di daftar 18 guru.
     * Format: [hari, kelas, mapel, kode guru, jam_mulai, jam_selesai].
     */
    private const JADWAL = [
        ['Kamis', '7A', 'Qaidah Baghdadiyah', 'IBNU', '08:50', '09:25'],
        ['Kamis', '7A', 'Qaidah Baghdadiyah', 'IBNU', '09:25', '10:00'],
        ['Kamis', '7B', 'Qaidah Baghdadiyah', 'IBNU', '07:40', '08:15'],
        ['Kamis', '7B', 'Qaidah Baghdadiyah', 'IBNU', '08:15', '08:50'],
        ['Kamis', '7C', 'Qaidah Baghdadiyah', 'MARYAM', '07:40', '08:15'],
        ['Kamis', '7C', 'Qaidah Baghdadiyah', 'MARYAM', '08:15', '08:50'],
        ['Kamis', '7C', 'Hadits', 'JUAIRIYAH', '08:50', '09:25'],
        ['Kamis', '7C', 'Hadits', 'JUAIRIYAH', '09:25', '10:00'],
        ['Kamis', '7D', 'Akhlaq', 'HAFSAH', '08:50', '09:25'],
        ['Kamis', '7D', 'Akhlaq', 'HAFSAH', '09:25', '10:00'],
        ['Kamis', '7D', 'Qaidah Baghdadiyah', 'SARIFAH', '07:40', '08:15'],
        ['Kamis', '7D', 'Qaidah Baghdadiyah', 'SARIFAH', '08:15', '08:50'],
        ['Kamis', '8C', 'Nahwu', 'ANIQOTUL', '08:50', '09:25'],
        ['Kamis', '8C', 'Nahwu', 'ANIQOTUL', '09:25', '10:00'],
        ['Kamis', '9A', 'Shorof', 'ZARKASI', '07:40', '08:15'],
        ['Kamis', '9A', 'Shorof', 'ZARKASI', '08:15', '08:50'],
        ['Kamis', '9B', 'Shorof', 'ZARKASI', '08:50', '09:25'],
        ['Kamis', '9B', 'Shorof', 'ZARKASI', '09:25', '10:00'],
        ['Kamis', '9C', 'Al-Qur\'an', 'ANIQOTUL', '07:40', '08:15'],
        ['Kamis', '9C', 'Al-Qur\'an', 'ANIQOTUL', '08:15', '08:50'],
        ['Rabu', '7A', 'Akhlaq', 'NAHROWI', '08:50', '09:25'],
        ['Rabu', '7A', 'Akhlaq', 'NAHROWI', '09:25', '10:00'],
        ['Rabu', '7A', 'Qaidah Baghdadiyah', 'IBNU', '07:40', '08:15'],
        ['Rabu', '7A', 'Qaidah Baghdadiyah', 'IBNU', '08:15', '08:50'],
        ['Rabu', '7B', 'Qaidah Baghdadiyah', 'IBNU', '08:50', '09:25'],
        ['Rabu', '7B', 'Qaidah Baghdadiyah', 'IBNU', '09:25', '10:00'],
        ['Rabu', '7C', 'Qaidah Baghdadiyah', 'MARYAM', '08:50', '09:25'],
        ['Rabu', '7C', 'Qaidah Baghdadiyah', 'MARYAM', '09:25', '10:00'],
        ['Rabu', '7D', 'Qaidah Baghdadiyah', 'SARIFAH', '08:50', '09:25'],
        ['Rabu', '7D', 'Qaidah Baghdadiyah', 'SARIFAH', '09:25', '10:00'],
        ['Rabu', '7D', 'Fiqih', 'KHOLISOH', '07:40', '08:15'],
        ['Rabu', '7D', 'Fiqih', 'KHOLISOH', '08:15', '08:50'],
        ['Rabu', '8B', 'Nahwu', 'ZARKASI', '07:40', '08:15'],
        ['Rabu', '8B', 'Nahwu', 'ZARKASI', '08:15', '08:50'],
        ['Rabu', '8C', 'Hadits', 'JUAIRIYAH', '07:40', '08:15'],
        ['Rabu', '8C', 'Hadits', 'JUAIRIYAH', '08:15', '08:50'],
        ['Rabu', '8D', 'Fiqih', 'KHOLISOH', '08:50', '09:25'],
        ['Rabu', '8D', 'Fiqih', 'KHOLISOH', '09:25', '10:00'],
        ['Rabu', '8D', 'Tauhid', 'NISFAH', '07:40', '08:15'],
        ['Rabu', '8D', 'Tauhid', 'NISFAH', '08:15', '08:50'],
        ['Rabu', '9C', 'Akhlaq', 'HAFSAH', '07:40', '08:15'],
        ['Sabtu', '7C', 'Akhlaq', 'HAFSAH', '09:20', '09:55'],
        ['Sabtu', '7C', 'Akhlaq', 'HAFSAH', '09:55', '10:30'],
        ['Sabtu', '8B', 'Akhlaq', 'JAMALUDIN', '10:30', '11:05'],
        ['Sabtu', '8B', 'Akhlaq', 'JAMALUDIN', '11:05', '11:40'],
        ['Sabtu', '8C', 'Shorof', 'RODHIAH', '09:20', '09:55'],
        ['Sabtu', '8C', 'Shorof', 'RODHIAH', '09:55', '10:30'],
        ['Sabtu', '8D', 'Hadits', 'JUAIRIYAH', '10:30', '11:05'],
        ['Sabtu', '8D', 'Hadits', 'JUAIRIYAH', '11:05', '11:40'],
        ['Sabtu', '9C', 'Nahwu', 'ANIQOTUL', '09:20', '09:55'],
        ['Sabtu', '9C', 'Nahwu', 'ANIQOTUL', '09:55', '10:30'],
        ['Selasa', '7A', 'Qaidah Baghdadiyah', 'IBNU', '07:40', '08:15'],
        ['Selasa', '7A', 'Qaidah Baghdadiyah', 'IBNU', '08:15', '08:50'],
        ['Selasa', '7B', 'Qaidah Baghdadiyah', 'IBNU', '08:50', '09:25'],
        ['Selasa', '7B', 'Qaidah Baghdadiyah', 'IBNU', '09:25', '10:00'],
        ['Selasa', '7C', 'Qaidah Baghdadiyah', 'MARYAM', '08:50', '09:25'],
        ['Selasa', '7C', 'Qaidah Baghdadiyah', 'MARYAM', '09:25', '10:00'],
        ['Selasa', '7C', 'Fiqih', 'KHOLISOH', '07:40', '08:15'],
        ['Selasa', '7C', 'Fiqih', 'KHOLISOH', '08:15', '08:50'],
        ['Selasa', '7D', 'Qaidah Baghdadiyah', 'SARIFAH', '08:50', '09:25'],
        ['Selasa', '7D', 'Qaidah Baghdadiyah', 'SARIFAH', '09:25', '10:00'],
        ['Selasa', '7D', 'Tauhid', 'NISFAH', '07:40', '08:15'],
        ['Selasa', '7D', 'Tauhid', 'NISFAH', '08:15', '08:50'],
        ['Selasa', '8A', 'Nahwu', 'ZARKASI', '07:40', '08:15'],
        ['Selasa', '8A', 'Nahwu', 'ZARKASI', '08:15', '08:50'],
        ['Selasa', '8C', 'Akhlaq', 'HAFSAH', '07:40', '08:15'],
        ['Selasa', '8C', 'Akhlaq', 'HAFSAH', '08:15', '08:50'],
        ['Selasa', '8C', 'Tauhid', 'NISFAH', '08:50', '09:25'],
        ['Selasa', '8C', 'Tauhid', 'NISFAH', '09:25', '10:00'],
        ['Selasa', '8D', 'Nahwu', 'ANIQOTUL', '08:50', '09:25'],
        ['Selasa', '8D', 'Nahwu', 'ANIQOTUL', '09:25', '10:00'],
        ['Selasa', '8D', 'Shorof', 'RODHIAH', '07:40', '08:15'],
        ['Selasa', '8D', 'Shorof', 'RODHIAH', '08:15', '08:50'],
        ['Selasa', '9A', 'Nahwu', 'ISKANDAR', '07:40', '08:15'],
        ['Selasa', '9A', 'Nahwu', 'ISKANDAR', '08:15', '08:50'],
        ['Selasa', '9C', 'Fiqih', 'KHOLISOH', '08:50', '09:25'],
        ['Selasa', '9C', 'Fiqih', 'KHOLISOH', '09:25', '10:00'],
        ['Selasa', '9C', 'Hadits', 'JUAIRIYAH', '07:40', '08:15'],
        ['Selasa', '9C', 'Hadits', 'JUAIRIYAH', '08:15', '08:50'],
        ['Senin', '7A', 'Qaidah Baghdadiyah', 'IBNU', '08:50', '09:25'],
        ['Senin', '7A', 'Qaidah Baghdadiyah', 'IBNU', '09:25', '10:00'],
        ['Senin', '7B', 'Akhlaq', 'NAHROWI', '08:50', '09:25'],
        ['Senin', '7B', 'Akhlaq', 'NAHROWI', '09:25', '10:00'],
        ['Senin', '7B', 'Qaidah Baghdadiyah', 'IBNU', '07:40', '08:15'],
        ['Senin', '7B', 'Qaidah Baghdadiyah', 'IBNU', '08:15', '08:50'],
        ['Senin', '7C', 'Qaidah Baghdadiyah', 'MARYAM', '07:40', '08:15'],
        ['Senin', '7C', 'Qaidah Baghdadiyah', 'MARYAM', '08:15', '08:50'],
        ['Senin', '7C', 'Tauhid', 'NISFAH', '08:50', '09:25'],
        ['Senin', '7C', 'Tauhid', 'NISFAH', '09:25', '10:00'],
        ['Senin', '7D', 'Qaidah Baghdadiyah', 'SARIFAH', '07:40', '08:15'],
        ['Senin', '7D', 'Qaidah Baghdadiyah', 'SARIFAH', '08:15', '08:50'],
        ['Senin', '7D', 'Hadits', 'JUAIRIYAH', '08:50', '09:25'],
        ['Senin', '7D', 'Hadits', 'JUAIRIYAH', '09:25', '10:00'],
        ['Senin', '8C', 'Fiqih', 'KHOLISOH', '08:50', '09:25'],
        ['Senin', '8C', 'Fiqih', 'KHOLISOH', '09:25', '10:00'],
        ['Senin', '8D', 'Akhlaq', 'HAFSAH', '08:50', '09:25'],
        ['Senin', '8D', 'Akhlaq', 'HAFSAH', '09:25', '10:00'],
        ['Senin', '9B', 'Nahwu', 'ISKANDAR', '08:50', '09:25'],
        ['Senin', '9B', 'Nahwu', 'ISKANDAR', '09:25', '10:00'],
        ['Senin', '9C', 'Shorof', 'RODHIAH', '08:50', '09:25'],
        ['Senin', '9C', 'Shorof', 'RODHIAH', '09:25', '10:00'],
        ['Senin', '9C', 'Tauhid', 'NISFAH', '07:40', '08:15'],
        ['Senin', '9C', 'Tauhid', 'NISFAH', '08:15', '08:50'],
    ];

    /**
     * Siswa kelas 7 (sumber: BIODATA 7A/7B/7C). Baris = [nis, nama, jk,
     * nama_kelas, tempat_lahir, tanggal_lahir]. Dua siswa (ABDURROZAQ, RISYA)
     * dari file tidak punya NIS - diisi sintetis unik '2425071991'/'2425071992'
     * agar kolom unique terpenuhi (boleh diubah manual setelah seed / pindah
     * ke baris dengan NIS asli bila sudah terbit dari sekolah).
     */
    private const SISWAS = [
        ['2425071028', 'ABDURROHMAN', 'L', '7A', 'BANDUNG BARAT', '2001-04-10'],
        ['2425071032', 'AKBAR M. ALFIKRI', 'L', '7A', 'BANDUNG', null],
        ['2425071034', 'ALEXA RAMADHAN KUSWANDI', 'L', '7A', 'BANDUNG', null],
        ['2425071041', 'BAGUS AHMAD RIFAA\'I', 'L', '7A', 'CIMAHI', null],
        ['2425071043', 'ELBRIGA ABYAN ASLAM', 'L', '7A', 'NGAWI', null],
        ['2425071048', 'GIRI WENDA WIBISONO', 'L', '7A', 'BANDUNG', null],
        ['2425071055', 'M. ALI ABDUL KODIR AL MAHPUDIN', 'L', '7A', 'BANDUNG', null],
        ['2425071056', 'M. KAIS ROFIK AL MURTADO', 'L', '7A', 'BANDUNG', null],
        ['2425071057', 'M. KHOTIB SYIRBINI', 'L', '7A', 'BANDUNG', null],
        ['2425071058', 'M. UBAIDILLAH AL FADLI', 'L', '7A', 'BANDUNG', null],
        ['2425071059', 'MAHARDIKA PRATAMA PUTRA', 'L', '7A', 'BANDUNG', null],
        ['2425071064', 'MUHAMAD AZKA ALDIANSYAH', 'L', '7A', 'BANDUNG', null],
        ['2425071065', 'MUHAMAD FATHURRAHMAN', 'L', '7A', 'CIMAHI', null],
        ['2425071067', 'MUHAMAD HASAN ISMAIL', 'L', '7A', 'CIMAHI', null],
        ['2425071069', 'MUHAMAD RIZAL MAULANA', 'L', '7A', 'BANDUNG', null],
        ['2425071071', 'MUHAMMAD ABDUL GHONI', 'L', '7A', 'CIMAHI', null],
        ['2425071072', 'MUHAMMAD ADITYA PRATAMA', 'L', '7A', 'CIMAHI', null],
        ['2425071076', 'MUHAMMAD IBNU FAUDZAN GINTING', 'L', '7A', 'BANDUNG', null],
        ['2425071079', 'MUHAMMAD RAFA HISAMUDIN', 'L', '7A', 'BANDUNG', null],
        ['2425071082', 'MUHAMMAD RIDWAN ABDURROHMAN', 'L', '7A', 'CIMAHI', null],
        ['2425071084', 'MUHAMMAD RIFQI MUTTAQIN', 'L', '7A', 'CIMAHI', null],
        ['2425071092', 'NIZAM NURPADILAH', 'L', '7A', 'BANDUNG', null],
        ['2425071096', 'REZA R.', 'L', '7A', 'BANDUNG', null],
        ['2425071109', 'TAURA KEITARO HAJJE', 'L', '7A', 'BREBES', null],
        ['2425071991', 'MUHAMMAD ABDURROZAQ', 'L', '7A', 'BANDUNG', null],
        ['2425071030', 'AGIS GHAISAN RAMADHAN', 'L', '7B', 'BANDUNG', null],
        ['2425071033', 'ALDEN ZASDAN AZZAHIR', 'L', '7B', 'CIMAHI', null],
        ['2425071039', 'ARIO JULIANTO', 'L', '7B', 'CIMAHI', null],
        ['2425071040', 'ASEP NURUL IMAN', 'L', '7B', 'BANDUNG', null],
        ['2425071044', 'EZAR RIZKI AZARIA', 'L', '7B', 'GARUT', null],
        ['2425071049', 'HAIKAL TANJUNG', 'L', '7B', 'BANDUNG', null],
        ['2425071060', 'MOCH ILHAM PERMANA', 'L', '7B', 'BANDUNG', null],
        ['2425071062', 'MOCHAMAD RAFA HARDIANSYAH', 'L', '7B', 'CIMAHI', null],
        ['2425071063', 'MUHAMAD ALI YUDISTIRA', 'L', '7B', 'CIMAHI', null],
        ['2425071066', 'MUHAMAD FITRA RAMADHAN', 'L', '7B', 'CIMAHI', null],
        ['2425071068', 'MUHAMAD RIDWAN SOLEHUDIN', 'L', '7B', 'BANDUNG', null],
        ['2425071070', 'MUHAMAD SALMAN ALFARIZI', 'L', '7B', 'BANDUNG', null],
        ['2425071073', 'MUHAMMAD FADHIL MAHFUZH', 'L', '7B', 'BANDUNG', null],
        ['2425071074', 'MUHAMMAD FAUZI RACHMAN', 'L', '7B', 'CIMAHI', null],
        ['2425071075', 'MUHAMMAD GHANIYY ZAHRON', 'L', '7B', 'BANDUNG', null],
        ['2425071077', 'MUHAMMAD IRFAN MAULANA', 'L', '7B', 'CIMAHI', null],
        ['2425071078', 'MUHAMMAD NAUVAL AL RASYADT', 'L', '7B', 'BANDUNG', null],
        ['2425071080', 'MUHAMMAD RAFFY SURYA PUTRA', 'L', '7B', 'BANDUNG', null],
        ['2425071081', 'MUHAMMAD RAFKHA', 'L', '7B', 'BANDUNG', null],
        ['2425071083', 'MUHAMMAD RIFKHI', 'L', '7B', 'BANDUNG', null],
        ['2425071085', 'MUHAMMAD ZAHWAN AZZAHRA', 'L', '7B', 'BANDUNG', null],
        ['2425071086', 'MUHAMMAD ZULFA NUGRAHA AL KALIFA', 'L', '7B', 'CIMAHI', null],
        ['2425071095', 'RADITA KURNIA  WILMANSYAH', 'L', '7B', 'BANDUNG', null],
        ['2425071099', 'SHEVA HAIDAR BIANDRA', 'L', '7B', 'BANDUNG', null],
        ['2425071110', 'TRIYADI AL GIFARI', 'L', '7B', 'CIMAHI', null],
        ['2425071029', 'ADINDA FINA FATMA WIJAYA', 'P', '7C', 'BANDUNG', null],
        ['2425071031', 'AISYAH WASILATUL AGNIYA', 'P', '7C', 'BANDUNG', null],
        ['2425071035', 'ALYA PUTRI NUR AZIZAH', 'P', '7C', 'CIMAHI', null],
        ['2425071036', 'ALYA SHINTYASARI WIDODO', 'P', '7C', 'CIMAHI', null],
        ['2425071037', 'ANNISA ZAKIYAH MUFIDAH', 'P', '7C', 'BANDUNG', null],
        ['2425071038', 'ARGHEA ZULFHA DWI ADINDA', 'P', '7C', 'CIMAHI', null],
        ['2425071042', 'DIVA UNSYUDAH KHANSA', 'P', '7C', 'CIMAHI', null],
        ['2425071045', 'FATHIMAH NURIN ZAHIRA', 'P', '7C', 'BANDUNG', null],
        ['2425071046', 'FATHIMAH TUZAHRO', 'P', '7C', 'CIMAHI', null],
        ['2425071047', 'FIRYAL HAFEEZA NAJLA BAHEERA', 'P', '7C', 'BANDUNG', null],
        ['2425071050', 'HILMA NURUL AZKIYA', 'P', '7C', 'BANDUNG', null],
        ['2425071051', 'INA INDRIYANTI', 'P', '7C', 'BANDUNG', null],
        ['2425071052', 'KANZA PUTRI DENIA', 'P', '7C', 'CIMAHI', null],
        ['2425071053', 'LEANDRA SANDI PUTRI', 'P', '7C', 'CIMAHI', null],
        ['2425071054', 'LIVYA BILLA CAHYANTI', 'P', '7C', 'CIMAHI', null],
        ['2425071087', 'N. NAZWA NUR ALIFAH', 'P', '7C', 'BANDUNG BARAT', null],
        ['2425071088', 'NADIA ALIATUZAHIRA SYATIBI', 'P', '7C', 'CIREBON', null],
        ['2425071089', 'NAJMA GEISA RAFIDA', 'P', '7C', 'BANDUNG', null],
        ['2425071090', 'NAYLA SANI PURNAMA SARI', 'P', '7C', 'BANDUNG BARAT', null],
        ['2425071091', 'NEISA NUR FAUZIAH', 'P', '7C', 'CIMAHI', null],
        ['2425071093', 'PAKIZA DAFIYA PUTRI', 'P', '7C', 'CIMAHI', null],
        ['2425071094', 'QONITA MUMTAZAH', 'P', '7C', 'BANDUNG', null],
        ['2425071992', 'RISYA ASYFA YASMIN', 'P', '7C', 'CIMAHI', null],
        ['2425071097', 'RIBBYNA DRUPADHI SYADITHA', 'P', '7C', 'BANDUNG BARAT', null],
        ['2425071098', 'SAFA ARNESYA AWALUNA', 'P', '7C', 'BANDUNG', null],
        ['2425071100', 'SILVIANTI', 'P', '7C', 'BANDUNG', null],
        ['2425071101', 'SIREN ZAKIATUZAHRA SYATIBI', 'P', '7C', 'CIREBON', null],
        ['2425071102', 'SITI KHOLIFATUL ISNAINI', 'P', '7C', 'BANDUNG', null],
        ['2425071103', 'SITI MARIYAH', 'P', '7C', 'CIMAHI', null],
        ['2425071104', 'SITI NURHANIPAH', 'P', '7C', 'BANDUNG', null],
        ['2425071105', 'SOFIA NURAINI AZZAHRA', 'P', '7C', 'CIMAHI', null],
        ['2425071106', 'SUIBAH ALASLAMIYAH', 'P', '7C', 'CIMAHI', null],
        ['2425071107', 'SYAFA SOFIYATUNNAFIISAH BALUKIAH', 'P', '7C', 'CIMAHI', null],
        ['2425071108', 'SYAFIRA NURUL AZMI', 'P', '7C', 'BANDUNG', null],
        ['2425071111', 'VILLYA JASMIN SIDIK', 'P', '7C', 'CIMAHI', null],
        ['2425071112', 'VIVI FAUZI ZAHRA', 'P', '7C', 'BANDUNG', null],
        ['2425071113', 'ZAHRA KANAYA ELIAYANA STIAWAN', 'P', '7C', 'GARUT', null],
        ['2425071114', 'ZALFA HASANAH NUR ZAHIRA', 'P', '7C', 'CIMAHI', null],
    ];

    private array $bentukKelas = [];

    public function run(): void
    {
        $this->buatSekolah();
        $this->buatMapels();
        $this->buatPraktikItems();
        $this->buatGuruDanKelas();
        $this->buatPengampuDanJadwal();
        $this->buatSiswa();
        $this->isiTempatTanggalRapot();
    }

    private function buatSekolah(): void
    {
        Sekolah::updateOrCreate(
            ['id' => 1],
            [
                'nama_sekolah' => 'SMP PLUS YPP DARUSSURUR',
                'kecamatan' => 'Cimahi',
                'kota_kabupaten' => 'Kota Cimahi',
                'provinsi' => 'Jawa Barat',
                'kepala_sekolah' => 'K.H. MUHAMMAD ISKANDAR DJULQORNAEN',
            ]
        );
    }

    private function buatMapels(): void
    {
        foreach (self::MAPELS as $mapel) {
            MapelPlus::updateOrCreate(
                ['kode' => $mapel['kode']],
                [
                    'nama' => $mapel['nama'],
                    'nama_ar' => $mapel['nama_ar'] ?? null,
                    'kelompok' => $mapel['kelompok'] ?? null,
                    'kkm_default' => $mapel['kkm_default'] ?? 70,
                    'urutan' => $mapel['urutan'] ?? 0,
                    'punya_progres_hafalan' => in_array($mapel['kode'], ['QURAN']),
                ]
            );
        }
    }

    private function buatPraktikItems(): void
    {
        foreach (self::PRAKTIK_ITEMS as $item) {
            PraktikItem::updateOrCreate(
                ['kode' => $item['kode']],
                ['nama_id' => $item['nama_id'], 'nama_ar' => $item['nama_ar'], 'urutan' => $item['urutan']]
            );
        }
    }

    private function buatGuruDanKelas(): void
    {
        $tahunAjaran = TahunAjaran::where('is_aktif', true)->firstOrFail();

        foreach (self::GURUS as $kode => $guru) {
            $nama = $guru['nama'];
            $email = $this->emailGuru($nama);
            $role = ($guru['wali_kelas'] ?? null) === null
                ? User::ROLE_GURU_PESANTREN
                : User::ROLE_WALI_KELAS;

            $user = User::firstOrCreate(
                ['email' => $email],
                [
                    'name' => $nama,
                    'password' => Hash::make('password'),
                    'role' => $role,
                    'is_active' => true,
                ]
            );

            Guru::firstOrCreate(
                ['user_id' => $user->id],
                ['nama' => $nama, 'is_aktif' => true]
            );
        }

        // Bentuk kelas 7A–9C
        foreach (self::GURUS as $kode => $guru) {
            $nama = $guru['nama'];
            if (($guru['wali_kelas'] ?? null) !== null) {
                $namaKelas = $guru['wali_kelas'];
                $tingkat = (int) substr($namaKelas, 0, 1);
                $user = User::where('email', $this->emailGuru($nama))->firstOrFail();
                $kelas = KelasRombel::firstOrCreate(
                    ['nama' => $namaKelas, 'tahun_ajaran_id' => $tahunAjaran->id],
                    ['tingkat' => $tingkat, 'wali_kelas_id' => $user->id]
                );
                $this->bentukKelas[$namaKelas] = $kelas->fresh();
            }
        }
    }

    private function buatPengampuDanJadwal(): void
    {
        $semester = Semester::where('is_aktif', true)->where('nama', 'Ganjil')->firstOrFail();

        // Simpan id guru & kelas per kode
        $guruByKode = [];
        foreach (self::GURUS as $kode => $guru) {
            $user = User::where('email', $this->emailGuru($guru['nama']))->firstOrFail();
            $guruByKode[$kode] = $user->guru;
        }

        $mapelByName = MapelPlus::pluck('id', 'nama')->all();

        // Buat guru_mapel_kelas sesuai daftar pengampu
        foreach (self::GURUS as $kode => $guru) {
            foreach ($guru['mengajar'] ?? [] as $namaMapel => $kelasList) {
                foreach ($kelasList as $namaKelas) {
                    GuruMapelKelas::firstOrCreate([
                        'guru_id' => $guruByKode[$kode]->id,
                        'mapel_plus_id' => $mapelByName[$namaMapel],
                        'kelas_rombel_id' => $this->bentukKelas[$namaKelas]->id,
                        'semester_id' => $semester->id,
                    ]);
                }
            }
        }

        // Jadwal mapel plus (idempoten: cari baris sama)
        foreach (self::JADWAL as $baris) {
            [$hari, $namaKelas, $namaMapel, $kodeGuru, $mulai, $selesai] = $baris;

            $gmk = GuruMapelKelas::where('guru_id', $guruByKode[$kodeGuru]->id)
                ->where('mapel_plus_id', $mapelByName[$namaMapel])
                ->where('kelas_rombel_id', $this->bentukKelas[$namaKelas]->id)
                ->where('semester_id', $semester->id)
                ->first();

            if ($gmk === null) {
                continue;
            }

            Jadwal::firstOrCreate([
                'guru_mapel_kelas_id' => $gmk->id,
                'hari' => $hari,
                'jam_mulai' => $mulai,
                'jam_selesai' => $selesai,
            ]);
        }
    }

    private function buatSiswa(): void
    {
        foreach (self::SISWAS as $baris) {
            [$nis, $nama, $jk, $namaKelas, $tempatLahir, $tanggalLahir] = $baris;

            Siswa::updateOrCreate(
                ['nis' => $nis],
                [
                    'nama' => $nama,
                    'kelas_rombel_id' => $this->bentukKelas[$namaKelas]->id,
                    'jenis_kelamin' => $jk,
                    'tempat_lahir' => $tempatLahir ?: null,
                    'tanggal_lahir' => $tanggalLahir ?: null,
                    'is_aktif' => true,
                ]
            );
        }
    }

    /** Email deterministik dari nama guru (slug), contoh: muhammad-yahya@sipp.sch.id */
    private function emailGuru(string $nama): string
    {
        $slug = Str::lower($nama);
        $slug = preg_replace('/^k\.h\.\s*/', '', $slug);
        $slug = preg_replace('/\(cibaduyut\)/', 'cibaduyut', $slug);
        $slug = preg_replace('/[^a-z0-9]+/', '-', $slug);
        $slug = trim($slug, '-');
        $slug = preg_replace('/-{2,}/', '-', $slug);

        return strtolower($slug).'@sipp.sch.id';
    }

    /** Tulis tempat & tanggal rapor di kolom semester (placeholder, diubah di admin). */
    private function isiTempatTanggalRapot(): void
    {
        $semester = Semester::first();
        if ($semester && $semester->tempat_tanggal_rapot === null) {
            $semester->update(['tempat_tanggal_rapot' => 'Cimahi, ... 2026']);
        }
    }
}
