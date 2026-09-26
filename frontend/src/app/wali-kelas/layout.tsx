"use client";

import { useEffect, useState } from "react";
import { DashboardShell } from "@/components/DashboardShell";
import { api } from "@/lib/api";

const navItems = [
  { href: "/wali-kelas", label: "Siswa Binaan" },
  { href: "/wali-kelas/nilai-diniyah", label: "Input Nilai Diniyah" },
  { href: "/wali-kelas/rapor", label: "Rapor Pesantren" },
];

// Wali kelas yang juga mengajar mapel (ada penugasan pengampu) mendapat menu guru
const guruNavGroups = [
  {
    label: "Guru Mapel",
    items: [
      { href: "/guru", label: "Jadwal Saya" },
      { href: "/guru/presensi", label: "Input Presensi" },
      { href: "/guru/nilai", label: "Input Nilai" },
      { href: "/guru/progres-hafalan", label: "Progres Hafalan" },
    ],
  },
];

export default function WaliKelasLayout({ children }: { children: React.ReactNode }) {
  const [punyaPenugasan, setPunyaPenugasan] = useState(false);

  useEffect(() => {
    api.get<unknown[]>("/pengampuan-saya")
      .then((res) => setPunyaPenugasan(res.data.length > 0))
      .catch(() => setPunyaPenugasan(false));
  }, []);

  return (
    <DashboardShell
      allowedRoles={["wali_kelas"]}
      navItems={navItems}
      navGroups={punyaPenugasan ? guruNavGroups : []}
    >
      {children}
    </DashboardShell>
  );
}
