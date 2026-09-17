"use client";

import RaporCetakList from "@/components/rapor/RaporCetakList";

export default function RaporWaliKelasPage() {
  return (
    <RaporCetakList
      bolehPilihKelas={false}
      judul="Rapor Pesantren"
      deskripsi="Rapor direal-time dari data nilai — pantau kelengkapan, lalu cetak kapan pun tanpa validasi."
    />
  );
}
