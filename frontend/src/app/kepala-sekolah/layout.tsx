import { DashboardShell } from "@/components/DashboardShell";

const navItems = [{ href: "/kepala-sekolah", label: "Validasi Rapor" }];

export default function KepalaSekolahLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardShell allowedRoles={["kepala_sekolah"]} navItems={navItems}>
      {children}
    </DashboardShell>
  );
}
