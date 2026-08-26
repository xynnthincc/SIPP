import { DashboardShell } from "@/components/DashboardShell";

const navItems = [
  { href: "/wali-kelas", label: "Siswa Binaan" },
  { href: "/wali-kelas/rapor", label: "Rapor Pesantren" },
];

export default function WaliKelasLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardShell allowedRoles={["wali_kelas"]} navItems={navItems}>
      {children}
    </DashboardShell>
  );
}
