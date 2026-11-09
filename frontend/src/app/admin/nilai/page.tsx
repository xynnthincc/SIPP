"use client";

import MatriksNilaiMassal from "@/components/nilai/MatriksNilaiMassal";

export default function NilaiAdminPage() {
  return (
    <MatriksNilaiMassal
      adminMode={true}
      judul="Input Nilai"
      deskripsi="Input nilai massal untuk kelas mana pun — semua kelas & semua mata pelajaran tersedia."
    />
  );
}
