import { DashboardShell } from "@/components/DashboardShell";

const navItems: { href: string; label: string }[] = [];

const navGroups = [
  {
    label: "Jadwal & Aktivitas",
    items: [
      { href: "/guru", label: "Jadwal Saya" },
      { href: "/guru/presensi", label: "Input Presensi" },
    ],
  },
  {
    label: "Penilaian",
    items: [
      { href: "/guru/nilai", label: "Input Nilai" },
      { href: "/guru/nilai-diniyah", label: "Input Nilai Diniyah" },
      { href: "/guru/progres-hafalan", label: "Progres Hafalan" },
    ],
  },
];

// Wali kelas yang juga mengajar (punya penugasan pengampu) memakai halaman yang sama
export default function GuruLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardShell allowedRoles={["guru_pesantren", "wali_kelas"]} navItems={navItems} navGroups={navGroups}>
      {children}
    </DashboardShell>
  );
}
