"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { PageHeader, Card, Button, Badge, Skeleton, EmptyState, Table, TableHead, TableBody, Th, Td, TableRow } from "@/components/ui";

interface Siswa {
  id: number;
  nis: string;
  nama: string;
}

interface Semester {
  id: number;
  nama: string;
  is_aktif: boolean;
}

interface Rapor {
  id: number;
  status: string;
  siswa: { id: number; nama: string };
}

const STATUS_VARIANT: Record<string, "success" | "warning" | "info" | "danger" | "default"> = {
  Draft: "default",
  Diajukan: "warning",
  Divalidasi: "info",
  Ditolak: "danger",
  Diterbitkan: "success",
};

export default function RaporWaliKelasPage() {
  const [siswas, setSiswas] = useState<Siswa[]>([]);
  const [semesterAktif, setSemesterAktif] = useState<Semester | null>(null);
  const [rapors, setRapors] = useState<Rapor[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const [kelasRes, taRes] = await Promise.all([
      api.get("/kelas-rombel"),
      api.get("/tahun-ajaran"),
    ]);

    const kelasId = kelasRes.data[0]?.id;
    if (kelasId) {
      const siswaRes = await api.get("/siswa", { params: { kelas_rombel_id: kelasId } });
      setSiswas(siswaRes.data.data ?? siswaRes.data);
    }

    const aktif = taRes.data.find((t: any) => t.is_aktif);
    const semAktif = aktif?.semesters?.find((s: Semester) => s.is_aktif) ?? null;
    setSemesterAktif(semAktif);

    if (semAktif) {
      const raporRes = await api.get<Rapor[]>("/rapors", { params: { semester_id: semAktif.id } });
      setRapors(raporRes.data);
    }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function raporUntuk(siswaId: number) {
    return rapors.find((r) => r.siswa.id === siswaId);
  }

  async function susunDraft(siswaId: number) {
    if (!semesterAktif) return;
    await api.post("/rapors", { siswa_id: siswaId, semester_id: semesterAktif.id });
    load();
  }

  async function ajukan(raporId: number) {
    await api.post(`/rapors/${raporId}/ajukan`);
    load();
  }

  return (
    <div className="animate-fade-in">
      <PageHeader title="Rapor Pesantren" description={`Semester ${semesterAktif?.nama ?? "..."}`} />

      {loading ? (
        <Skeleton className="h-40 w-full" />
      ) : siswas.length === 0 ? (
        <EmptyState title="Tidak ada siswa" description="Tidak ada siswa yang perlu diraporkan." />
      ) : (
        <Card>
          <Table>
            <TableHead>
              <Th>NIS</Th>
              <Th>Nama</Th>
              <Th>Status</Th>
              <Th>Aksi</Th>
            </TableHead>
            <TableBody>
              {siswas.map((s) => {
                const rapor = raporUntuk(s.id);
                const status = rapor?.status;
                return (
                  <TableRow key={s.id}>
                    <Td className="font-mono text-xs">{s.nis}</Td>
                    <Td className="font-medium">{s.nama}</Td>
                    <Td>
                      <Badge variant={STATUS_VARIANT[status ?? "default"] || "default"}>
                        {status ?? "Belum disusun"}
                      </Badge>
                    </Td>
                    <Td>
                      {!rapor && (
                        <Button size="sm" onClick={() => susunDraft(s.id)}>Susun Draft</Button>
                      )}
                      {status === "Draft" && (
                        <Button size="sm" onClick={() => ajukan(rapor!.id)}>Ajukan</Button>
                      )}
                      {status === "Ditolak" && (
                        <span className="text-xs text-slate-400">Perbaiki & ajukan ulang</span>
                      )}
                    </Td>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
