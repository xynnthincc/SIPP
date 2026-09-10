"use client";

import { FormEvent, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { PageHeader, Card, Button, Input, Table, TableHead, TableBody, Th, Td, TableRow, Badge, Skeleton, EmptyState } from "@/components/ui";

interface MapelPlus {
  id: number;
  kode: string;
  nama: string;
  punya_progres_hafalan: boolean;
  jenis_assessments_count: number;
}

export default function MapelPlusPage() {
  const [data, setData] = useState<MapelPlus[]>([]);
  const [form, setForm] = useState({ kode: "", nama: "", punya_progres_hafalan: false });
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);

  async function load() {
    setLoading(true);
    const res = await api.get<MapelPlus[]>("/mapel-plus");
    setData(res.data);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setCreating(true);
    await api.post("/mapel-plus", form);
    setForm({ kode: "", nama: "", punya_progres_hafalan: false });
    setShowForm(false);
    setCreating(false);
    load();
  }

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Mata Pelajaran Plus"
        description="Tahfidz, Tahsin, Kitab Kuning, Bahasa Arab, Akhlak."
        action={<Button onClick={() => setShowForm(!showForm)}>{showForm ? "Tutup" : "+ Tambah Mapel"}</Button>}
      />

      {showForm && (
        <Card className="mb-6 animate-slide-up">
          <form onSubmit={handleCreate} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Kode" value={form.kode} onChange={(e) => setForm({ ...form, kode: e.target.value.toUpperCase() })} placeholder="TAHFIDZ" required />
            <Input label="Nama Mapel" value={form.nama} onChange={(e) => setForm({ ...form, nama: e.target.value })} placeholder="Tahfidz Al-Quran" required />
            <div className="sm:col-span-2">
              <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
                <input type="checkbox" checked={form.punya_progres_hafalan} onChange={(e) => setForm({ ...form, punya_progres_hafalan: e.target.checked })} className="rounded border-slate-300 text-emerald-500 focus:ring-emerald-500" />
                Punya tracker hafalan
              </label>
            </div>
            <div className="sm:col-span-2">
              <Button type="submit" loading={creating}>Simpan</Button>
            </div>
          </form>
        </Card>
      )}

      {loading ? (
        <Skeleton className="h-40 w-full" />
      ) : data.length === 0 ? (
        <EmptyState title="Belum ada mapel plus" description="Tambahkan mata pelajaran kepesantrenan baru." />
      ) : (
        <Card>
          <Table>
            <TableHead>
              <Th>Kode</Th>
              <Th>Nama</Th>
              <Th>Assessment</Th>
              <Th>Hafalan</Th>
            </TableHead>
            <TableBody>
              {data.map((m) => (
                <TableRow key={m.id}>
                  <Td className="font-mono text-xs font-semibold">{m.kode}</Td>
                  <Td className="font-medium">{m.nama}</Td>
                  <Td>{m.jenis_assessments_count}</Td>
                  <Td><Badge variant={m.punya_progres_hafalan ? "success" : "default"}>{m.punya_progres_hafalan ? "Ya" : "Tidak"}</Badge></Td>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
