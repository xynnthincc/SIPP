"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
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
    });
  }, []);

  return (
    <div className="animate-fade-in">
      <PageHeader title="Jadwal Mengajar Saya" description="Jadwal mengajar yang ditetapkan oleh admin." />

      {loading ? (
        <Skeleton className="h-40 w-full" />
      ) : data.length === 0 ? (
        <EmptyState
          title="Belum ada jadwal"
          description="Minta admin untuk menetapkan Anda sebagai pengampu mapel di kelas tertentu."
        />
      ) : (
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
          {data.map((j) => (
            <Card key={j.id} hover>
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="font-semibold text-slate-800">
                    {j.guru_mapel_kelas.mapel_plus.nama}
                  </p>
                  <p className="text-sm text-slate-500">
                    Kelas {j.guru_mapel_kelas.kelas_rombel.nama}
                  </p>
                </div>
                <Badge variant={dayColors[j.hari] ?? "default"}>{j.hari}</Badge>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {j.jam_mulai} - {j.jam_selesai}
                {j.ruangan && (
                  <span className="text-slate-400 ml-2">
                    <svg className="w-4 h-4 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3H21m-3.75 3H21" />
                    </svg>{" "}
                    {j.ruangan}
                  </span>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
