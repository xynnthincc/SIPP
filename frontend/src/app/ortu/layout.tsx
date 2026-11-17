import { DashboardShell } from "@/components/DashboardShell";

const navItems = [{ href: "/ortu", label: "Progres Anak" }];

export default function OrtuLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardShell allowedRoles={["orang_tua"]} navItems={navItems}>
      {children}
    </DashboardShell>
  );
}
