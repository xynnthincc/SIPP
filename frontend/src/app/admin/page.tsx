"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

interface Statistik {
  jumlahSiswa: number;
  jumlahGuru: number;
  jumlahMapel: number;
  jumlahKelas: number;
  raporSelesai: number;
  raporTotal: number;
  siswaAktif: number;
  mapelProgres: number;
}

function useStatistik() {
  const [data, setData] = useState<Statistik | null>(null);

  useEffect(() => {
    let aktif = true;
    Promise.all([
      api.get("/siswa"),
      api.get("/guru"),
      api.get("/mapel-plus"),
      api.get("/kelas-rombel"),
      api.get("/rapors"),
    ])
      .then(([siswa, guru, mapel, kelas, rapor]) => {
        if (!aktif) return;
        const daftarSiswa = siswa.data.data ?? siswa.data;
        const daftarRapor = rapor.data;
        const mapelList = mapel.data;
        const totalSiswa = Array.isArray(daftarSiswa) ? daftarSiswa.length : 0;
        const totalRapor = Array.isArray(daftarRapor) ? daftarRapor.length : 0;
        const selesai = Array.isArray(daftarRapor)
          ? daftarRapor.filter((r: { status: string }) => r.status === "Diterbitkan").length
          : 0;
        const guruList = guru.data;
        const kelasList = kelas.data;
        setData({
          jumlahSiswa: totalSiswa,
          jumlahGuru: Array.isArray(guruList) ? guruList.length : 0,
          jumlahMapel: Array.isArray(mapelList) ? mapelList.length : 0,
          jumlahKelas: Array.isArray(kelasList) ? kelasList.length : 0,
          raporSelesai: selesai,
          raporTotal: totalRapor,
          siswaAktif: Array.isArray(daftarSiswa) ? daftarSiswa.filter((s: { is_aktif: boolean }) => s.is_aktif !== false).length : 0,
          mapelProgres: mapelList.filter((m: { punya_progres_hafalan: boolean }) => m.punya_progres_hafalan).length,
        });
      })
      .catch(() => {
        if (aktif) setData(null);
      });
    return () => {
      aktif = false;
    };
  }, []);

  return data;
}

function StatCard({
  label,
  value,
  hint,
  icon,
  tone,
}: {
  label: string;
  value: string;
  hint?: string;
  icon: string;
  tone: "emerald" | "amber" | "mint";
}) {
  const toneClass =
    tone === "mint"
      ? "bg-emerald-500/10 text-emerald-700"
      : tone === "amber"
        ? "bg-amber-500/20 text-amber-700"
        : "bg-emerald-700/10 text-emerald-800";

  return (
    <div className="bg-white rounded-xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.05)] border border-slate-100 relative overflow-hidden h-full">
      <span className={`absolute -right-4 -top-4 w-24 h-24 rounded-full ${toneClass} opacity-10`} />
      <div className="flex items-center justify-between mb-4 relative z-10">
        <span className="text-sm font-semibold text-slate-500">{label}</span>
        <div className={`relative w-10 h-10 rounded-lg ${toneClass.replace(/opacity-10$/, "")} flex items-center justify-center`}>
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            {icon === "siswa" && <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />}
            {icon === "guru" && <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5" />}
            {icon === "mapel" && <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />}
            {icon === "kelas" && <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5" />}
            {icon === "rapor" && <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />}
          </svg>
        </div>
      </div>
      <h3 className="relative z-10 text-3xl font-bold text-slate-900 mb-1">{value}</h3>
      {hint && <p className="relative z-10 text-sm text-slate-500">{hint}</p>}
    </div>
  );
}

interface ProgresItem {
  siswa: string;
  kelas: string;
  juz: string;
  persen: number;
}

function ProgresRow({ item }: { item: ProgresItem }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className="w-11 h-11 rounded-full bg-emerald-700/10 text-emerald-800 flex items-center justify-center font-bold shrink-0">
        {item.siswa.charAt(0)}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex justify-between items-end mb-1.5">
          <div className="min-w-0">
            <p className="text-sm font-medium text-slate-800 truncate">{item.siswa}</p>
            <p className="text-xs text-slate-400">{item.kelas}</p>
          </div>
          <span className="text-sm font-semibold text-emerald-700 align-baseline">
            {item.persen}%
          </span>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-2">
          <div
            className="bg-gradient-to-r from-emerald-500 to-emerald-700 h-2 rounded-full transition-all duration-1000"
            style={{ width: `${item.persen}%` }}
          />
        </div>
        <p className="text-[11px] text-slate-400 mt-1">{item.juz}</p>
      </div>
    </div>
  );
}

export default function AdminHomePage() {
  const { user } = useAuth();
  const stat = useStatistik();

  const raporPersen = stat && stat.raporTotal > 0
    ? Math.min(100, Math.round((stat.raporSelesai / stat.raporTotal) * 100))
    : 0;

  const progresItems: ProgresItem[] = [
    { siswa: "Ahmad Fauzan", kelas: "Kelas 9A", juz: "Juz 30 & Juz 1", persen: 85 },
    { siswa: "Muhammad Rizky", kelas: "Kelas 8B", juz: "Juz 30", persen: 60 },
    { siswa: "Siti Aisyah", kelas: "Kelas 9C", juz: "Juz 30, Juz 1, Juz 2", persen: 92 },
  ];

  const greeting = `Assalamu'alaikum, ${user?.name?.split(" ")[0] ?? "Administrator"} 👋`;

  return (
    <div className="animate-fade-in max-w-7xl mx-auto">
      {/* Welcome Header */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-slate-900 mb-2">{greeting}</h2>
        <p className="text-lg text-slate-500">
          Berikut adalah ringkasan data operasional SMP Plus YPP Darussurur hari ini.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Siswa" value={stat ? String(stat.jumlahSiswa) : "—"} icon="siswa" tone="mint" hint={stat ? `${stat.siswaAktif} aktif` : undefined} />
        <StatCard label="Total Guru" value={stat ? String(stat.jumlahGuru) : "—"} icon="guru" tone="amber" hint="Staf pengajar" />
        <StatCard label="Mata Pelajaran" value={stat ? String(stat.jumlahMapel) : "—"} icon="mapel" tone="emerald" hint={stat ? `${stat.mapelProgres} dengan progres hafalan` : undefined} />
        <StatCard label="Kelas / Rombel" value={stat ? String(stat.jumlahKelas) : "—"} icon="kelas" tone="mint" hint="Rombongan belajar" />
      </div>

      {/* Rapor + Kehadiran */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        {/* Kehadiran chart placeholder */}
        <div className="lg:col-span-2 bg-white rounded-xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.05)] border border-slate-100">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-xl font-semibold text-slate-900">Statistik Kehadiran Siswa</h3>
              <p className="text-sm text-slate-500">Ringkasan bulan ini</p>
            </div>
            <Link
              href="/admin/tahun-ajaran"
              className="flex items-center gap-2 px-3 py-1.5 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Filter <span className="text-xs">▾</span>
            </Link>
          </div>
          <div className="w-full h-64 bg-white rounded-lg border border-dashed border-slate-200 flex items-center justify-center text-center px-6">
            <div>
              <div className="w-12 h-12 mx-auto mb-3 flex items-center justify-center rounded-xl bg-emerald-700/10 text-emerald-700">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5M9 11.25v1.5M12 9v3.75m3-6v6" />
                </svg>
              </div>
              <p className="text-sm text-slate-500">
                Grafik kehadiran akan tampil di sini setelah data presensi masuk.
              </p>
            </div>
          </div>
        </div>

        {/* Rapor progress */}
        <div className="bg-white rounded-xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.05)] border border-slate-100 h-full">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-semibold text-slate-500">Rapor Terbit</span>
            <div className="relative w-10 h-10 rounded-lg bg-emerald-700/10 text-emerald-800 flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75" />
              </svg>
            </div>
          </div>
          <h3 className="text-3xl font-bold text-slate-900 mb-2">
            {stat ? `${stat.raporSelesai}` : "—"}
          </h3>
          <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2">
            <div
              className="bg-emerald-700 h-1.5 rounded-full transition-all duration-1000"
              style={{ width: `${raporPersen}%` }}
            />
          </div>
          <p className="text-sm text-slate-500 mt-2">{raporPersen}% dari total rapor</p>
        </div>
      </div>

      {/* Progress Tahfidz */}
      <div className="bg-white rounded-xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.05)] border border-slate-100">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-xl font-semibold text-slate-900">Progress Tahfidz Siswa</h3>
            <p className="text-sm text-slate-500">Top Achievers — Semester Ganjil</p>
          </div>
          <Link href="/guru/progres-hafalan" className="text-sm font-medium text-emerald-700 hover:underline">
            Lihat Semua
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {progresItems.map((item) => (
            <ProgresRow key={item.siswa} item={item} />
          ))}
        </div>
      </div>
    </div>
  );
}