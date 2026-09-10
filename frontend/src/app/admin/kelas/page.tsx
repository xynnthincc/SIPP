"use client";

import { FormEvent, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { PageHeader, Card, Button, Input, Select, Table, TableHead, TableBody, Th, Td, TableRow, Skeleton, EmptyState } from "@/components/ui";

interface KelasRombel {
  id: number;
  nama: string;
  tingkat: number;
  siswas_count: number;
  wali_kelas: { id: number; name: string } | null;
}

export default function KelasPage() {
  const [data, setData] = useState<KelasRombel[]>([]);
  const [nama, setNama] = useState("");
  const [tingkat, setTingkat] = useState(7);
  const [tahunAjaranId, setTahunAjaranId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  async function load() {
    setLoading(true);
    const [kelasRes, taRes] = await Promise.all([
      api.get<KelasRombel[]>("/kelas-rombel"),
      api.get("/tahun-ajaran"),
    ]);
    setData(kelasRes.data);
    const aktif = taRes.data.find((t: any) => t.is_aktif);
    if (aktif) setTahunAjaranId(aktif.id);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    if (!tahunAjaranId) return;
    setCreating(true);
    await api.post("/kelas-rombel", { nama, tingkat, tahun_ajaran_id: tahunAjaranId });
    setNama("");
    setCreating(false);
    load();
  }

  return (
    <div className="animate-fade-in">
      <PageHeader title="Kelas / Rombel" description="Kelola rombel dan penugasan wali kelas." />

      <Card className="mb-6">
        <form onSubmit={handleCreate} className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <Input value={nama} onChange={(e) => setNama(e.target.value)} placeholder="contoh: VII-A" required />
          </div>
          <div className="w-full sm:w-40">
            <Select value={tingkat} onChange={(e) => setTingkat(Number(e.target.value))}>
              <option value={7}>Tingkat 7</option>
              <option value={8}>Tingkat 8</option>
              <option value={9}>Tingkat 9</option>
            </Select>
          </div>
          <Button type="submit" loading={creating}>Tambah</Button>
        </form>
      </Card>

      {loading ? (
        <Skeleton className="h-40 w-full" />
      ) : data.length === 0 ? (
        <EmptyState title="Belum ada kelas" description="Buat kelas/rombel baru melalui form di atas." />
      ) : (
        <Card>
          <Table>
            <TableHead>
              <Th>Kelas</Th>
              <Th>Tingkat</Th>
              <Th>Wali Kelas</Th>
              <Th>Jumlah Siswa</Th>
            </TableHead>
            <TableBody>
              {data.map((k) => (
                <TableRow key={k.id}>
                  <Td className="font-medium">{k.nama}</Td>
                  <Td>{k.tingkat}</Td>
                  <Td>{k.wali_kelas?.name ?? <span className="text-slate-400">-</span>}</Td>
                  <Td>{k.siswas_count}</Td>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
