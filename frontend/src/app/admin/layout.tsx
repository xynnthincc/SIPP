import { DashboardShell } from "@/components/DashboardShell";

const navItems = [
  { href: "/admin", label: "Ringkasan" },
];

const navGroups = [
  {
    label: "Kelompok Akademik",
    items: [
      { href: "/admin/tahun-ajaran", label: "Tahun Ajaran & Semester" },
      { href: "/admin/kelas", label: "Kelas/Rombel" },
      { href: "/admin/mapel-plus", label: "Mata Pelajaran Plus" },
      { href: "/admin/predikat", label: "Rentang Predikat" },
    ],
  },
  {
    label: "Tenaga & Peserta Didik",
    items: [
      { href: "/admin/guru", label: "Data Guru" },
      { href: "/admin/siswa", label: "Data Siswa" },
      { href: "/admin/jadwal", label: "Jadwal & Pengampu" },
    ],
  },
  {
    label: "Penilaian",
    items: [
      { href: "/admin/praktik", label: "Praktik & Hafalan" },
    ],
  },
  {
    label: "Sekolah",
    items: [
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
