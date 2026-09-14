"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { PageHeader, Card, Badge, Skeleton, EmptyState, Table, TableHead, TableBody, Th, Td, TableRow } from "@/components/ui";

interface Rapor {
  id: number;
  status: string;
  siswa: { id: number };
  semester: { id: number; nama: string };
}

interface RincianItem {
  jenis: string;
  kategori: "formatif" | "sumatif";
  nilai: number;
  bobot: number;
}

interface RekapItem {
  mapel: string;
  nilai_akhir: number | null;
  predikat: string | null;
  rincian: RincianItem[];
}

interface DeskripsiCapaian {
  id: number;
  deskripsi: string;
  mapel_plus: { nama: string };
}

const STATUS_VARIANT: Record<string, "success" | "warning" | "info" | "danger" | "default"> = {
  Draft: "default",
  Diajukan: "warning",
  Divalidasi: "info",
  Ditolak: "danger",
  Diterbitkan: "success",
};

export default function RaporSiswaPage() {
  const [rapors, setRapors] = useState<Rapor[]>([]);
  const [rekap, setRekap] = useState<Record<number, RekapItem[]>>({});
  const [deskripsi, setDeskripsi] = useState<Record<number, DeskripsiCapaian[]>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<Rapor[]>("/rapors").then(async (res) => {
      setRapors(res.data);
      for (const r of res.data.filter((r) => r.status === "Diterbitkan")) {
        const [rk, dc] = await Promise.all([
          api.get<RekapItem[]>(`/siswas/${r.siswa.id}/nilai-rekap/${r.semester.id}`),
          api.get<DeskripsiCapaian[]>("/deskripsi-capaian", { params: { semester_id: r.semester.id } }),
        ]);
        setRekap((prev) => ({ ...prev, [r.id]: rk.data }));
        setDeskripsi((prev) => ({ ...prev, [r.id]: dc.data }));
      }
      setLoading(false);
    });
  }, []);

  return (
    <div className="animate-fade-in">
      <PageHeader title="Rapor Saya" description="Rapor pesantren, rekap nilai, predikat, dan deskripsi capaian." />

      {loading ? (
        <Skeleton className="h-40 w-full" />
      ) : rapors.length === 0 ? (
        <EmptyState title="Belum ada rapor" description="Rapor akan muncul setelah diterbitkan oleh kepala sekolah." />
      ) : (
        <div className="space-y-4">
          {rapors.map((r) => (
            <Card key={r.id}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-slate-800">Semester {r.semester.nama}</h3>
                <Badge variant={STATUS_VARIANT[r.status] || "default"}>{r.status}</Badge>
              </div>

              {rekap[r.id] && (
                <Table className="mb-4">
                  <TableHead>
                    <Th>Mata Pelajaran</Th>
                    <Th className="text-right">Nilai Akhir</Th>
                    <Th>Predikat</Th>
                  </TableHead>
                  <TableBody>
                    {rekap[r.id].map((item, i) => (
                      <TableRow key={i}>
                        <Td>{item.mapel}</Td>
                        <Td className="text-right font-semibold">{item.nilai_akhir ?? "-"}</Td>
                        <Td>
                          {item.predikat ? <Badge variant="success">{item.predikat}</Badge> : <span className="text-slate-400">-</span>}
                        </Td>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}

              {deskripsi[r.id] && deskripsi[r.id].length > 0 && (
                <div className="border-t border-slate-100 pt-3">
                  <p className="text-xs font-semibold text-slate-500 uppercase mb-2">Deskripsi Capaian</p>
                  <ul className="space-y-1.5">
                    {deskripsi[r.id].map((d) => (
                      <li key={d.id} className="text-sm text-slate-600">
                        <span className="font-medium text-slate-800">{d.mapel_plus.nama}:</span> {d.deskripsi}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
