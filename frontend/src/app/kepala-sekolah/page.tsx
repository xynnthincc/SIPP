"use client";

import RaporCetakList from "@/components/rapor/RaporCetakList";

export default function KepalaSekolahHomePage() {
  return (
    <RaporCetakList
      bolehPilihKelas={true}
      judul="Rapor Pesantren"
      deskripsi="Pantau kesiapan rapor seluruh kelas dan cetak langsung — tanpa proses validasi."
    />
  );
}
