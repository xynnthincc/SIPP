"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { PageHeader, Card, StatCard, Badge, Skeleton, EmptyState, Button } from "@/components/ui";

interface SetoranHafalan {
  id: number;
  tanggal_setoran: string;
  materi: string;
  status: string;
  mapel_plus: { nama: string } | null;
}

interface PresensiSiswa {
  id: number;
  tanggal: string;
  status: "Hadir" | "Sakit" | "Izin" | "Alpa";
}

interface RaporSiswa {
  id: number;
  status: string;
  semester: { nama: string } | null;
}

const HAFALAN_VARIANT: Record<string, "success" | "warning" | "danger"> = {
  Lancar: "success",
  "Perlu Perbaikan": "warning",
  Mengulang: "danger",
};

const RAPOR_VARIANT: Record<string, "success" | "warning" | "info" | "danger" | "default"> = {
  Draft: "default",
  Diajukan: "warning",
  Divalidasi: "info",
  Ditolak: "danger",
  Diterbitkan: "success",
};

const REKAP_KEHADIRAN = [
  { status: "Hadir", bar: "bg-emerald-500" },
  { status: "Sakit", bar: "bg-amber-500" },
  { status: "Izin", bar: "bg-blue-500" },
  { status: "Alpa", bar: "bg-red-500" },
] as const;

function formatTanggal(nilai: string): string {
  const d = new Date(nilai);
  return Number.isNaN(d.getTime())
    ? nilai
    : d.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}

export default function SiswaHomePage() {
  const { user } = useAuth();
  const [setoran, setSetoran] = useState<SetoranHafalan[] | null>(null);
  const [presensi, setPresensi] = useState<PresensiSiswa[] | null>(null);
  const [rapors, setRapors] = useState<RaporSiswa[] | null>(null);

  useEffect(() => {
    let aktif = true;
    api
      .get<SetoranHafalan[]>("/progres-hafalan")
      .then((r) => {
        if (aktif) setSetoran(r.data);
      })
      .catch(() => {
        if (aktif) setSetoran([]);
      });
    api
      .get<PresensiSiswa[]>("/presensi")
      .then((r) => {
        if (aktif) setPresensi(r.data);
      })
      .catch(() => {
        if (aktif) setPresensi([]);
      });
    api
      .get<RaporSiswa[]>("/rapors")
      .then((r) => {
        if (aktif) setRapors(r.data);
      })
      .catch(() => {
        if (aktif) setRapors([]);
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

  const raporTerbaru = useMemo(
    () => (rapors && rapors.length > 0 ? rapors.reduce((a, b) => (b.id > a.id ? b : a)) : null),
    [rapors],
  );

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <PageHeader
          title={`Halo, ${user?.name?.split(" ")[0] ?? "Siswa"} 👋`}
          description="Ringkasan hafalan, kehadiran, dan rapor pesantren Anda."
        />
        <Link href="/siswa/rapor" className="shrink-0">
          <Button variant="outline" size="sm">Lihat Rapor Saya</Button>
        </Link>
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
        <StatCard
          label="Total Setoran Hafalan"
          value={setoran ? String(setoran.length) : "—"}
          color="emerald"
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
            </svg>
          }
        />
        <StatCard
          label="Persentase Kehadiran"
          value={rekapKehadiran ? `${rekapKehadiran.persenHadir}%` : "—"}
          color="blue"
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <StatCard
          label="Status Rapor Terbaru"
          value={raporTerbaru ? raporTerbaru.status : rapors === null ? "—" : "Belum ada"}
          color="purple"
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
          }
        />
      </div>

      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
        <Card>
          <h3 className="text-sm font-semibold text-slate-700 mb-3">Setoran Hafalan Terbaru</h3>
          {setoran === null ? (
            <div className="space-y-2">
              <Skeleton className="h-14" />
              <Skeleton className="h-14" />
              <Skeleton className="h-14" />
            </div>
          ) : setoran.length === 0 ? (
            <EmptyState
              title="Belum ada setoran"
              description="Setoran hafalan Anda akan tercatat di sini setelah guru menginputnya."
            />
          ) : (
            <div className="space-y-2">
              {setoran.slice(0, 5).map((s) => (
                <div key={s.id} className="p-3 rounded-xl bg-slate-50/50">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium text-slate-800">{s.mapel_plus?.nama ?? "-"}</p>
                    <Badge variant={HAFALAN_VARIANT[s.status] ?? "default"}>{s.status}</Badge>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">{s.materi}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{formatTanggal(s.tanggal_setoran)}</p>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <h3 className="text-sm font-semibold text-slate-700 mb-3">Rekap Kehadiran</h3>
          {presensi === null || rekapKehadiran === null ? (
            <div className="space-y-2">
              <Skeleton className="h-8" />
              <Skeleton className="h-8" />
              <Skeleton className="h-8" />
            </div>
          ) : rekapKehadiran.total === 0 ? (
            <EmptyState
              title="Belum ada presensi"
              description="Rekap kehadiran akan muncul setelah presensi pesantren dicatat."
            />
          ) : (
            <div className="space-y-3">
              {REKAP_KEHADIRAN.map((r) => {
                const jumlah = rekapKehadiran.hitung[r.status] ?? 0;
                const persen = Math.round((jumlah / rekapKehadiran.total) * 100);
                return (
                  <div key={r.status}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-slate-600">{r.status}</span>
                      <span className="font-semibold text-slate-800">{jumlah}</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2">
                      <div
                        className={`${r.bar} h-2 rounded-full transition-all duration-700`}
                        style={{ width: `${persen}%` }}
                      />
                    </div>
                  </div>
                );
              })}
              {raporTerbaru && raporTerbaru.semester && (
                <p className="text-xs text-slate-400 pt-2 border-t border-slate-100">
                  Rapor terakhir: Semester {raporTerbaru.semester.nama} —{" "}
                  <Badge variant={RAPOR_VARIANT[raporTerbaru.status] ?? "default"}>
                    {raporTerbaru.status}
                  </Badge>
                </p>
              )}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
