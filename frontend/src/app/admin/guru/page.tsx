"use client";

import { FormEvent, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { PageHeader, Card, Button, Input, Table, TableHead, TableBody, Th, Td, TableRow, Badge, Skeleton, EmptyState, Modal } from "@/components/ui";

interface Guru {
  id: number;
  nip: string | null;
  nama: string;
  no_hp: string | null;
  is_aktif: boolean;
  user: { email: string };
}

export default function GuruPage() {
  const [data, setData] = useState<Guru[]>([]);
  const [form, setForm] = useState({ nama: "", email: "", password: "", nip: "", no_hp: "" });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);

  async function load() {
    setLoading(true);
    const res = await api.get<Guru[]>("/guru");
    setData(res.data);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setCreating(true);
    try {
      await api.post("/guru", form);
      setForm({ nama: "", email: "", password: "", nip: "", no_hp: "" });
      setShowForm(false);
      load();
    } catch (err: any) {
      setError(err.response?.data?.message ?? "Gagal menyimpan guru.");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Data Guru Pesantren"
        description="Menambahkan guru otomatis membuat akun login untuknya."
        action={<Button onClick={() => setShowForm(!showForm)}>{showForm ? "Tutup" : "+ Tambah Guru"}</Button>}
      />

      {showForm && (
        <Card className="mb-6 animate-slide-up">
          <form onSubmit={handleCreate} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <Input label="Nama Lengkap" value={form.nama} onChange={(e) => setForm({ ...form, nama: e.target.value })} placeholder="Nama guru" required />
            </div>
            <Input label="Email Login" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="email@guru.id" required />
            <Input label="Password Awal" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Min 8 karakter" required />
            <Input label="NIP/NUPTK (opsional)" value={form.nip} onChange={(e) => setForm({ ...form, nip: e.target.value })} placeholder="Nomor identitas" />
            <Input label="No. HP (opsional)" value={form.no_hp} onChange={(e) => setForm({ ...form, no_hp: e.target.value })} placeholder="08xxx" />
            {error && <p className="sm:col-span-2 text-sm text-red-500">{error}</p>}
            <div className="sm:col-span-2">
              <Button type="submit" loading={creating}>Simpan Guru</Button>
            </div>
          </form>
        </Card>
      )}

      {loading ? (
        <Skeleton className="h-40 w-full" />
      ) : data.length === 0 ? (
        <EmptyState title="Belum ada guru" description="Tambahkan guru pesantren baru melalui tombol di atas." />
      ) : (
        <Card>
          <Table>
            <TableHead>
              <Th>Nama</Th>
              <Th>Email</Th>
              <Th>NIP</Th>
              <Th>Status</Th>
            </TableHead>
            <TableBody>
              {data.map((g) => (
                <TableRow key={g.id}>
                  <Td className="font-medium">{g.nama}</Td>
                  <Td className="text-slate-500">{g.user.email}</Td>
                  <Td className="font-mono text-xs">{g.nip ?? <span className="text-slate-400">-</span>}</Td>
                  <Td><Badge variant={g.is_aktif ? "success" : "default"}>{g.is_aktif ? "Aktif" : "Nonaktif"}</Badge></Td>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
