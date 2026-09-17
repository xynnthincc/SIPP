"use client";

import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { labelKelas } from "@/lib/kelas";
import { Badge, Skeleton } from "@/components/ui";

interface Statistik {
  jumlahSiswa: number;
  jumlahGuru: number;
  jumlahMapel: number;
  jumlahKelas: number;
  siswaAktif: number | null;
  mapelProgres: number;
}

interface ProgresItem {
  lengkap: boolean;
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
    ])
      .then(([siswa, guru, mapel, kelas]) => {
        if (!aktif) return;
        const daftarSiswa = siswa.data.data ?? siswa.data;
        const mapelList = mapel.data;
        const guruList = guru.data;
        const kelasList = kelas.data;
        // /siswa untuk admin di-paginate 20/halaman: pakai meta `total` supaya hitungan tidak terpotong
        const totalSiswa =
          typeof siswa.data.total === "number"
            ? siswa.data.total
            : Array.isArray(daftarSiswa)
              ? daftarSiswa.length
              : 0;
        setData({
          jumlahSiswa: totalSiswa,
          jumlahGuru: Array.isArray(guruList) ? guruList.length : 0,
          jumlahMapel: Array.isArray(mapelList) ? mapelList.length : 0,
          jumlahKelas: Array.isArray(kelasList) ? kelasList.length : 0,
          // Jumlah "aktif" hanya akurat bila daftar siswa tidak terpotong paginasi
          siswaAktif:
            Array.isArray(daftarSiswa) && daftarSiswa.length === totalSiswa
              ? daftarSiswa.filter((s: { is_aktif: boolean }) => s.is_aktif !== false).length
              : null,
          mapelProgres: Array.isArray(mapelList)
            ? mapelList.filter((m: { punya_progres_hafalan: boolean }) => m.punya_progres_hafalan).length
            : 0,
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

// Kesiapan rapor semester aktif: berapa siswa yang nilai mapel & praktiknya lengkap
function useRaporProgres() {
  const [data, setData] = useState<{ lengkap: number; total: number } | null>(null);

  useEffect(() => {
    let aktif = true;
    api
      .get<{ is_aktif: boolean; id: number }[]>("/semester")
      .then((semRes) => {
        const aktifSem = semRes.data.find((s) => s.is_aktif);
        if (!aktifSem) return null;
        return api
          .get<ProgresItem[]>("/rapor/progres", { params: { semester_id: aktifSem.id } })
          .then((r) => {
            if (aktif) {
              setData({
                lengkap: r.data.filter((p) => p.lengkap).length,
                total: r.data.length,
              });
            }
            return null;
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

interface SetoranHafalan {
  id: number;
  siswa_id: number;
  tanggal_setoran: string;
  materi: string;
  status: string;
  mapel_plus: { nama: string } | null;
  siswa: { nama: string; kelas_rombel: { nama: string } | null } | null;
}

interface PresensiItem {
  id: number;
  tanggal: string;
  status: "Hadir" | "Sakit" | "Izin" | "Alpa";
}

const HAFALAN_VARIANT: Record<string, "success" | "warning" | "danger"> = {
  Lancar: "success",
  "Perlu Perbaikan": "warning",
  Mengulang: "danger",
};

const LEGENDA_PRESENSI = [
  { status: "Hadir", dot: "bg-emerald-500" },
  { status: "Sakit", dot: "bg-amber-500" },
  { status: "Izin", dot: "bg-blue-500" },
  { status: "Alpa", dot: "bg-red-500" },
] as const;

function formatTanggal(nilai: string): string {
  const d = new Date(nilai);
  return Number.isNaN(d.getTime())
    ? nilai
    : d.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}

function formatHari(nilai: string): string {
  const d = new Date(nilai);
  return Number.isNaN(d.getTime())
    ? nilai
    : d.toLocaleDateString("id-ID", { weekday: "short", day: "numeric", month: "short" });
}

function SetoranRow({ item }: { item: SetoranHafalan }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-11 h-11 rounded-full bg-emerald-700/10 text-emerald-800 flex items-center justify-center font-bold shrink-0">
        {item.siswa?.nama?.charAt(0) ?? "?"}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-medium text-slate-800 truncate">
            {item.siswa?.nama ?? `Siswa #${item.siswa_id}`}
          </p>
          <Badge variant={HAFALAN_VARIANT[item.status] ?? "default"}>{item.status}</Badge>
        </div>
        <p className="text-xs text-slate-400">{labelKelas(item.siswa?.kelas_rombel?.nama) ?? "Tanpa kelas"}</p>
        <p className="text-sm text-slate-600 mt-1 truncate">{item.materi}</p>
        <p className="text-[11px] text-slate-400 mt-0.5">
          {item.mapel_plus?.nama ?? "-"} • {formatTanggal(item.tanggal_setoran)}
        </p>
      </div>
    </div>
  );
}

export default function AdminHomePage() {
  const { user } = useAuth();
  const stat = useStatistik();
  const raporProgres = useRaporProgres();
  const [presensi, setPresensi] = useState<PresensiItem[] | null>(null);
  const [setoran, setSetoran] = useState<SetoranHafalan[] | null>(null);

  useEffect(() => {
    let aktif = true;
    api
      .get<PresensiItem[]>("/presensi")
      .then((r) => {
        if (aktif) setPresensi(r.data);
      })
      .catch(() => {
        if (aktif) setPresensi([]);
      });
    api
      .get<SetoranHafalan[]>("/progres-hafalan")
      .then((r) => {
        if (aktif) setSetoran(r.data);
      })
      .catch(() => {
        if (aktif) setSetoran([]);
      });
    return () => {
      aktif = false;
    };
  }, []);

  const rekapKehadiran = useMemo(() => {
    if (!presensi) return null;
    const hitung: Record<string, number> = { Hadir: 0, Sakit: 0, Izin: 0, Alpa: 0 };
    for (const p of presensi) {
      hitung[p.status] = (hitung[p.status] ?? 0) + 1;
    }
    const total = presensi.length;
    return {
      hitung,
      total,
      persenHadir: total > 0 ? Math.round((hitung.Hadir / total) * 100) : 0,
    };
  }, [presensi]);

  const kehadiranPerHari = useMemo(() => {
    if (!presensi) return [];
    const perTanggal = new Map<string, { total: number; hadir: number }>();
    for (const p of presensi) {
      const cur = perTanggal.get(p.tanggal) ?? { total: 0, hadir: 0 };
      cur.total += 1;
      if (p.status === "Hadir") cur.hadir += 1;
      perTanggal.set(p.tanggal, cur);
    }
    return [...perTanggal.entries()]
      .sort((a, b) => (a[0] < b[0] ? 1 : -1))
      .slice(0, 7)
      .reverse()
      .map(([tanggal, v]) => ({
        tanggal,
        persen: v.total > 0 ? Math.round((v.hadir / v.total) * 100) : 0,
      }));
  }, [presensi]);

  const raporPersen = raporProgres && raporProgres.total > 0
    ? Math.min(100, Math.round((raporProgres.lengkap / raporProgres.total) * 100))
    : 0;

  const greeting = `Assalamu'alaikum, ${user?.name?.split(" ")[0] ?? "Administrator"}`;

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
        <StatCard label="Total Siswa" value={stat ? String(stat.jumlahSiswa) : "—"} icon="siswa" tone="mint" hint={stat && stat.siswaAktif !== null ? `${stat.siswaAktif} aktif` : undefined} />
        <StatCard label="Total Guru" value={stat ? String(stat.jumlahGuru) : "—"} icon="guru" tone="amber" hint="Staf pengajar" />
        <StatCard label="Mata Pelajaran" value={stat ? String(stat.jumlahMapel) : "—"} icon="mapel" tone="emerald" hint={stat ? `${stat.mapelProgres} dengan progres hafalan` : undefined} />
        <StatCard label="Kelas / Rombel" value={stat ? String(stat.jumlahKelas) : "—"} icon="kelas" tone="mint" hint="Rombongan belajar" />
      </div>

      {/* Rapor + Kehadiran */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        {/* Kehadiran chart dinamis dari /presensi */}
        <div className="lg:col-span-2 bg-white rounded-xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.05)] border border-slate-100">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-xl font-semibold text-slate-900">Statistik Kehadiran Siswa</h3>
              <p className="text-sm text-slate-500">Persentase hadir 7 hari pertemuan terakhir</p>
            </div>
            {rekapKehadiran && (
              <span className="px-3 py-1.5 rounded-lg bg-emerald-700/10 text-emerald-800 text-sm font-semibold">
                {rekapKehadiran.persenHadir}% hadir
              </span>
            )}
          </div>
          {presensi === null || rekapKehadiran === null ? (
            <Skeleton className="h-64 w-full" />
          ) : kehadiranPerHari.length === 0 ? (
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
          ) : (
            <div>
              <div className="flex items-end justify-between gap-3 h-48">
                {kehadiranPerHari.map((d) => (
                  <div key={d.tanggal} className="flex-1 flex flex-col items-center gap-1.5 min-w-0">
                    <span className="text-xs font-semibold text-slate-600">{d.persen}%</span>
                    <div className="w-full max-w-14 bg-slate-100 rounded-t-lg h-28 flex flex-col justify-end overflow-hidden">
                      <div
                        className="w-full bg-gradient-to-t from-emerald-600 to-emerald-400 transition-all duration-700"
                        style={{ height: `${d.persen}%` }}
                      />
                    </div>
                    <span className="text-[11px] text-slate-400 truncate">{formatHari(d.tanggal)}</span>
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mt-5 pt-4 border-t border-slate-100 text-sm">
                <span className="text-slate-400">
                  Total {rekapKehadiran.total} presensi tercatat
                </span>
                {LEGENDA_PRESENSI.map((l) => (
                  <span key={l.status} className="inline-flex items-center gap-1.5 text-slate-600">
                    <span className={`w-2.5 h-2.5 rounded-full ${l.dot}`} />
                    {l.status} <span className="font-semibold">{rekapKehadiran.hitung[l.status] ?? 0}</span>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Rapor siap cetak */}
        <div className="bg-white rounded-xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.05)] border border-slate-100 h-full">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-semibold text-slate-500">Rapor Siap Cetak</span>
            <div className="relative w-10 h-10 rounded-lg bg-emerald-700/10 text-emerald-800 flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75" />
              </svg>
            </div>
          </div>
          <h3 className="text-3xl font-bold text-slate-900 mb-2">
            {raporProgres ? `${raporProgres.lengkap}` : "—"}
          </h3>
          <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2">
            <div
              className="bg-emerald-700 h-1.5 rounded-full transition-all duration-1000"
              style={{ width: `${raporPersen}%` }}
            />
          </div>
          <p className="text-sm text-slate-500 mt-2">
            {raporProgres ? `${raporPersen}% dari ${raporProgres.total} siswa nilai lengkap` : "Memuat…"}
          </p>
        </div>
      </div>

      {/* Aktivitas hafalan terbaru */}
      <div className="bg-white rounded-xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.05)] border border-slate-100">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-xl font-semibold text-slate-900">Aktivitas Hafalan Terbaru</h3>
            <p className="text-sm text-slate-500">6 setoran hafalan siswa terakhir</p>
          </div>
        </div>
        {setoran === null ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Skeleton className="h-16" />
            <Skeleton className="h-16" />
            <Skeleton className="h-16" />
          </div>
        ) : setoran.length === 0 ? (
          <p className="text-sm text-slate-500">
            Belum ada setoran hafalan yang dicatat guru.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {setoran.slice(0, 6).map((item) => (
              <SetoranRow key={item.id} item={item} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}