"use client";

import { DashboardShell } from "@/components/DashboardShell";
import { useAuth } from "@/lib/auth-context";
import { useRoleNav } from "@/lib/nav";

export default function WaliKelasLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const nav = useRoleNav(user?.role);

  return (
    <DashboardShell allowedRoles={nav.allowedRoles} navItems={nav.navItems} navGroups={nav.navGroups}>
      {children}
    </DashboardShell>
  );
}
