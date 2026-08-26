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
