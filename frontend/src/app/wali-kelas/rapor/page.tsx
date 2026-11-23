"use client";

import RaporCetakList from "@/components/rapor/RaporCetakList";

/**
 * Rapor siswa binaan wali kelas.
 * Kelas terkunci otomatis ke kelas binaan (backend /kelas-rombel sudah
 * di-scope), tapi semester tetap bisa dipilih — termasuk wadah Sementara.
 */
export default function WaliKelasRaporPage() {
  return (
    <RaporCetakList
      bolehPilihKelas={false}
      judul="Rapor Siswa Binaan"
      deskripsi="Pantau kesiapan nilai dan cetak rapor siswa di kelas binaan Anda — real-time, tanpa proses validasi."
    />
  );
}
