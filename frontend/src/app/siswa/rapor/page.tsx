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

interface RekapItem {
  mapel: string;
  nilai_akhir: number | null;
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<Rapor[]>("/rapors").then(async (res) => {
      setRapors(res.data);
      for (const r of res.data.filter((r) => r.status === "Diterbitkan")) {
        const rk = await api.get<RekapItem[]>(`/siswas/${r.siswa.id}/nilai-rekap/${r.semester.id}`);
        setRekap((prev) => ({ ...prev, [r.id]: rk.data }));
      }
      setLoading(false);
    });
  }, []);

  return (
    <div className="animate-fade-in">
      <PageHeader title="Rapor Saya" description="Rapor pesantren dan rekap nilai." />

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
                <Table>
                  <TableHead>
                    <Th>Mata Pelajaran</Th>
                    <Th className="text-right">Nilai Akhir</Th>
                  </TableHead>
                  <TableBody>
                    {rekap[r.id].map((item, i) => (
                      <TableRow key={i}>
                        <Td>{item.mapel}</Td>
                        <Td className="text-right font-semibold">{item.nilai_akhir ?? "-"}</Td>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
