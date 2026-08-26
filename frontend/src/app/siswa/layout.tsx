import { DashboardShell } from "@/components/DashboardShell";

const navItems = [
  { href: "/siswa", label: "Ringkasan" },
  { href: "/siswa/rapor", label: "Rapor Saya" },
];

export default function SiswaLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardShell allowedRoles={["siswa"]} navItems={navItems}>
      {children}
    </DashboardShell>
  );
}
