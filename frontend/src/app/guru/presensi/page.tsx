import PresensiHarian from "@/components/presensi/PresensiHarian";

/**
 * Halaman lama /guru/presensi dipertahankan agar tautan lama tidak 404.
 * Komponen akan menolak akun guru mapel dan hanya menampilkan form untuk
 * wali kelas/admin.
 */
export default function PresensiGuruPage() {
  return <PresensiHarian />;
}
