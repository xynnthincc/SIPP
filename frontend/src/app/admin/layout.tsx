import { DashboardShell } from "@/components/DashboardShell";

const navItems = [
  { href: "/admin", label: "Ringkasan" },
];

const navGroups = [
  {
    label: "Data Master",
    items: [
      { href: "/admin/tahun-ajaran", label: "Tahun Ajaran & Semester" },
      { href: "/admin/kelas", label: "Kelas/Rombel" },
      { href: "/admin/siswa", label: "Data Siswa" },
      { href: "/admin/guru", label: "Data Guru" },
      { href: "/admin/mapel-plus", label: "Mata Pelajaran Plus" },
      { href: "/admin/predikat", label: "Rentang Predikat" },
    ],
  },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardShell allowedRoles={["admin"]} navItems={navItems} navGroups={navGroups}>
      {children}
    </DashboardShell>
  );
}