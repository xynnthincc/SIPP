"use client";

import RaporCetakList from "@/components/rapor/RaporCetakList";

export default function AdminRaporPage() {
  return (
    <RaporCetakList
      bolehPilihKelas={true}
      judul="Cetak Rapor"
      deskripsi="Pantau kesiapan rapor seluruh kelas dan cetak langsung."
    />
  );
}
