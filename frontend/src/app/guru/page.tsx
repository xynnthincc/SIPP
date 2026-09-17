"use client";

import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import { labelKelas } from "@/lib/kelas";
import { PageHeader, Card, Badge, Skeleton, EmptyState } from "@/components/ui";

interface JadwalItem {
  id: number;
  hari: string;
  jam_mulai: string;
  jam_selesai: string;
  ruangan: string | null;
  guru_mapel_kelas: {
    mapel_plus: { nama: string };
    kelas_rombel: { nama: string };
  };
}

type HariWarna = "success" | "warning" | "danger" | "info" | "default" | "purple";

const URUTAN_HARI = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];

const dayColors: Record<string, HariWarna> = {
  Senin: "info",
  Selasa: "success",
  Rabu: "warning",
  Kamis: "purple",
  Jumat: "info",
  Sabtu: "default",
  Minggu: "default",
};

export default function JadwalGuruPage() {
  const [data, setData] = useState<JadwalItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<JadwalItem[]>("/jadwal").then((res) => {
      setData(res.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const perHari = useMemo(() => {
    const grup = new Map<string, JadwalItem[]>();
    for (const j of data) {
      const daftar = grup.get(j.hari) ?? [];
      daftar.push(j);
      grup.set(j.hari, daftar);
    }
    return [...grup.entries()].sort(
      (a, b) => URUTAN_HARI.indexOf(a[0]) - URUTAN_HARI.indexOf(b[0])
    );
  }, [data]);

  const jumlahKelas = useMemo(
    () => new Set(data.map((j) => j.guru_mapel_kelas.kelas_rombel.nama)).size,
    [data]
  );

  return (
    <div className="animate-fade-in">
      <PageHeader title="Jadwal Mengajar Saya" description="Jadwal mengajar yang ditetapkan oleh admin." />

      {loading ? (
        <Skeleton className="h-64 w-full" />
      ) : data.length === 0 ? (
        <EmptyState
          title="Belum ada jadwal"
          description="Minta admin untuk menetapkan Anda sebagai pengampu mapel di kelas tertentu."
        />
      ) : (
        <div className="space-y-5 sm:space-y-6">
          {/* Ringkasan — konsisten dengan kartu statistik di admin & wali kelas */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Total Sesi</p>
              <p className="text-2xl font-bold text-slate-800 mt-1">{data.length}</p>
              <p className="text-xs text-slate-400 mt-0.5">pertemuan per pekan</p>
            </Card>
            <Card>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Hari Mengajar</p>
              <p className="text-2xl font-bold text-slate-800 mt-1">{perHari.length}</p>
              <p className="text-xs text-slate-400 mt-0.5">hari dalam sepekan</p>
            </Card>
            <Card>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Kelas Diampu</p>
              <p className="text-2xl font-bold text-slate-800 mt-1">{jumlahKelas}</p>
              <p className="text-xs text-slate-400 mt-0.5">rombongan belajar</p>
            </Card>
          </div>

          {/* Jadwal per hari */}
          <div className="space-y-4">
            {perHari.map(([hari, daftar]) => (
              <Card key={hari}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Badge variant={dayColors[hari] ?? "default"}>{hari}</Badge>
                    <h3 className="text-sm font-semibold text-slate-700">
                      {daftar.length} sesi
                    </h3>
                  </div>
                </div>
                <div className="divide-y divide-slate-100">
                  {daftar.map((j) => (
                    <div key={j.id} className="flex flex-wrap items-center justify-between gap-2 py-3 first:pt-0 last:pb-0">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-full bg-emerald-500/10 text-emerald-700 flex items-center justify-center text-sm font-semibold shrink-0">
                          {j.guru_mapel_kelas.mapel_plus.nama.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-slate-800 truncate">
                            {j.guru_mapel_kelas.mapel_plus.nama}
                          </p>
                          <p className="text-xs text-slate-400">
                            {labelKelas(j.guru_mapel_kelas.kelas_rombel.nama) ?? j.guru_mapel_kelas.kelas_rombel.nama}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-100 text-slate-600 font-medium">
                          <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {j.jam_mulai} - {j.jam_selesai}
                        </span>
                        {j.ruangan && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-100 text-slate-600">
                            <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3H21m-3.75 3H21" />
                            </svg>
                            {j.ruangan}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
