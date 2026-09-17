export type Role =
  | "admin"
  | "guru_pesantren"
  | "wali_kelas"
  | "kepala_sekolah"
  | "siswa"
  | "orang_tua";

export interface User {
  id: number;
  name: string;
  email: string;
  role: Role;
  identifier: string | null;
  is_active: boolean;
}

// Label tampilan & path dashboard per role — dipakai di sidebar dan redirect setelah login
export const ROLE_LABELS: Record<Role, string> = {
  admin: "Admin",
  guru_pesantren: "Guru Pesantren",
  wali_kelas: "Wali Kelas",
  kepala_sekolah: "Kepala Sekolah",
  siswa: "Siswa",
  orang_tua: "Orang Tua/Wali",
};

export const ROLE_HOME: Record<Role, string> = {
  admin: "/admin",
  guru_pesantren: "/guru",
  wali_kelas: "/wali-kelas",
  kepala_sekolah: "/kepala-sekolah",
  siswa: "/siswa",
  orang_tua: "/ortu",
};

export interface MapelPlus {
  id: number;
  kode: string;
  nama: string;
  nama_ar: string | null;
  kelompok: string | null;
  kkm_default: number;
  urutan: number;
  deskripsi: string | null;
  punya_progres_hafalan: boolean;
  jenis_assessments_count: number;
}

export interface PraktikItem {
  id: number;
  kode: string;
  nama_id: string;
  nama_ar: string | null;
  urutan: number;
  nilai_praktiks_count: number;
}

export interface Guru {
  id: number;
  user_id: number;
  nip: string | null;
  nama: string;
  no_hp: string | null;
  is_aktif: boolean;
  user: User;
  praktik_items: PraktikItem[];
}

export interface Siswa {
  id: number;
  nis: string;
  nama: string;
  kelas_rombel_id: number | null;
  jenis_kelamin: "L" | "P";
  tempat_lahir: string | null;
  tanggal_lahir: string | null;
  is_aktif: boolean;
  alamat: string | null;
  sekolah_asal: string | null;
  nama_ayah: string | null;
  nama_ibu: string | null;
  no_wa_ayah: string | null;
  profesi_ayah: string | null;
  profesi_ibu: string | null;
  agama: string | null;
  status_anak: string | null;
  anak_ke: string | null;
  no_telp: string | null;
  foto: string | null;
  diterima_kelas: string | null;
  diterima_tanggal: string | null;
  no_telp_ibu: string | null;
  alamat_ortu: string | null;
  nama_wali: string | null;
  pekerjaan_wali: string | null;
  alamat_wali: string | null;
  no_telp_wali: string | null;
  kelas_rombel?: { id: number; nama: string; tingkat: number };
  user?: User;
}

export interface Sekolah {
  id: number;
  nama_sekolah: string;
  npsn: string | null;
  alamat: string | null;
  kelurahan: string | null;
  kecamatan: string | null;
  kota_kabupaten: string | null;
  provinsi: string | null;
  kode_pos: string | null;
  telepon: string | null;
  kepala_sekolah: string | null;
  nip_kepala_sekolah: string | null;
}

export interface NilaiMapelRekap {
  id: number;
  kode: string;
  nama: string;
  nama_ar: string | null;
  kelompok: string | null;
  kkm_default: number;
  urutan: number;
  nilai_mapel: { kkm: number; nilai: number | null } | null;
  nilai_akhir: number | null;
  predikat: string | null;
  bisa_edit: boolean;
}

export interface PraktikRekap {
  id: number;
  kode: string;
  nama_id: string;
  nama_ar: string | null;
  urutan: number;
  nilai: string | null;
  keterangan: string | null;
  bisa_edit: boolean;
}

export interface LogEditNilai {
  updated_by: number;
  updated_at: string;
  updater?: { id: number; name: string };
}

export interface RaporCetak {
  status: string;
  sekolah: Sekolah;
  siswa: { id: number; nama: string; nis: string };
  kelas: { nama: string; tingkat: number } | null;
  wali_kelas: string | null;
  semester: { nama: string; tahun: string; tempat_tanggal_rapot: string | null };
  mapel: {
    nama_id: string;
    nama_ar: string | null;
    kkm: number | null;
    nilai: number | null;
    angka_arab: string | null;
    terbilang: string | null;
    ket_nilai: string | null;
  }[];
  total: number;
  rata2: number;
  rata2_bulat: number;
  peringkat: number | null;
  predikat: { predikat_ar: string; predikat_id: string; deskripsi: string } | null;
  praktik: { kode: string; nama_id: string; nama_ar: string | null; nilai: string | null; keterangan: string | null }[];
  pembiasaan: number | null;
  sikap: { akhlaq: string | null; kepribadian: string | null } | null;
  kehadiran: { sakit: number; izin: number; alpa: number } | null;
}
