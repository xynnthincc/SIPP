"use client";

import { FormEvent, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { PageHeader, Card, Button, Input, Select, Table, TableHead, TableBody, Th, Td, TableRow, Badge, Skeleton, EmptyState } from "@/components/ui";

interface Siswa {
  id: number;
  nis: string;
  nama: string;
  jenis_kelamin: "L" | "P";
  kelas_rombel: { id: number; nama: string } | null;
}

interface KelasOption {
  id: number;
  nama: string;
}

export default function SiswaPage() {
  const [data, setData] = useState<Siswa[]>([]);
  const [kelasList, setKelasList] = useState<KelasOption[]>([]);
  const [form, setForm] = useState({ nis: "", nama: "", jenis_kelamin: "L", kelas_rombel_id: "" });
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);

  async function load() {
    setLoading(true);
    const [siswaRes, kelasRes] = await Promise.all([
      api.get("/siswa"),
      api.get<KelasOption[]>("/kelas-rombel"),
    ]);
    setData(siswaRes.data.data ?? siswaRes.data);
    setKelasList(kelasRes.data);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setCreating(true);
    await api.post("/siswa", { ...form, kelas_rombel_id: form.kelas_rombel_id || null });
    setForm({ nis: "", nama: "", jenis_kelamin: "L", kelas_rombel_id: "" });
    setShowForm(false);
    setCreating(false);
    load();
  }

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Data Siswa"
        description="Daftar seluruh siswa pesantren."
        action={<Button onClick={() => setShowForm(!showForm)}>{showForm ? "Tutup" : "+ Tambah Siswa"}</Button>}
      />

      {showForm && (
        <Card className="mb-6 animate-slide-up">
          <form onSubmit={handleCreate} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="NIS" value={form.nis} onChange={(e) => setForm({ ...form, nis: e.target.value })} placeholder="Nomor Induk Siswa" required />
            <Input label="Nama Lengkap" value={form.nama} onChange={(e) => setForm({ ...form, nama: e.target.value })} placeholder="Nama siswa" required />
            <Select label="Jenis Kelamin" value={form.jenis_kelamin} onChange={(e) => setForm({ ...form, jenis_kelamin: e.target.value })}>
              <option value="L">Laki-laki</option>
              <option value="P">Perempuan</option>
            </Select>
            <Select label="Kelas" value={form.kelas_rombel_id} onChange={(e) => setForm({ ...form, kelas_rombel_id: e.target.value })} placeholder="Belum ada kelas">
              {kelasList.map((k) => (
                <option key={k.id} value={k.id}>{k.nama}</option>
              ))}
            </Select>
            <div className="sm:col-span-2">
              <Button type="submit" loading={creating}>Simpan Siswa</Button>
            </div>
          </form>
        </Card>
      )}

      {loading ? (
        <Skeleton className="h-40 w-full" />
      ) : data.length === 0 ? (
        <EmptyState title="Belum ada siswa" description="Tambahkan siswa baru melalui tombol di atas." />
      ) : (
        <Card>
          <Table>
            <TableHead>
              <Th>NIS</Th>
              <Th>Nama</Th>
              <Th>Kelas</Th>
              <Th>L/P</Th>
            </TableHead>
            <TableBody>
              {data.map((s) => (
                <TableRow key={s.id}>
                  <Td className="font-mono text-xs">{s.nis}</Td>
                  <Td className="font-medium">{s.nama}</Td>
                  <Td>{s.kelas_rombel?.nama ?? <span className="text-slate-400">-</span>}</Td>
                  <Td><Badge variant={s.jenis_kelamin === "L" ? "info" : "purple"}>{s.jenis_kelamin === "L" ? "Laki-laki" : "Perempuan"}</Badge></Td>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
