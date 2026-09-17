import { DashboardShell } from "@/components/DashboardShell";

const navItems = [
  { href: "/guru", label: "Jadwal Saya" },
  { href: "/guru/presensi", label: "Input Presensi" },
  { href: "/guru/nilai", label: "Input Nilai" },
  { href: "/guru/nilai-diniyah", label: "Input Nilai Diniyah" },
  { href: "/guru/progres-hafalan", label: "Progres Hafalan" },
];

export default function GuruLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardShell allowedRoles={["guru_pesantren"]} navItems={navItems}>
      {children}
    </DashboardShell>
  );
}
