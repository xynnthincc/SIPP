import { DashboardShell } from "@/components/DashboardShell";

const navItems = [
  { href: "/admin", label: "Ringkasan" },
];

const navGroups = [
  {
    label: "Manajemen Akademik",
    items: [
      { href: "/admin/tahun-ajaran", label: "Tahun Ajaran & Semester" },
      { href: "/admin/kelas", label: "Kelas/Rombel" },
      { href: "/admin/jadwal", label: "Jadwal & Pengampu" },
      { href: "/admin/mapel-plus", label: "Mata Pelajaran Plus" },
    ],
  },
  {
    label: "Sivitas Akademika",
    items: [
      { href: "/admin/guru", label: "Data Guru" },
      { href: "/admin/siswa", label: "Data Siswa" },
      { href: "/admin/pengguna", label: "Kelola Pengguna" },
    ],
  },
  {
    label: "Konfigurasi & Evaluasi",
    items: [
      { href: "/admin/praktik", label: "Praktik & Hafalan" },
      { href: "/admin/predikat", label: "Rentang Predikat" },
      { href: "/admin/sekolah", label: "Profil Sekolah" },
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
