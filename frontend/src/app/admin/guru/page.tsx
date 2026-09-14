"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import {
  PageHeader, Card, Button, Input, Table, TableHead, TableBody, Th, Td, TableRow,
  Badge, Skeleton, EmptyState, Modal, ConfirmModal, IconButton, Alert,
} from "@/components/ui";

interface Guru {
  id: number;
  nip: string | null;
  nama: string;
  no_hp: string | null;
  is_aktif: boolean;
  user: { email: string };
}

const emptyForm = { nama: "", email: "", password: "", nip: "", no_hp: "" };

export default function GuruPage() {
  const [data, setData] = useState<Guru[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Guru | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hapus, setHapus] = useState<Guru | null>(null);
  const [hapusLoading, setHapusLoading] = useState(false);
  const [hapusError, setHapusError] = useState<string | null>(null);

  const load = useCallback(() => {
    api.get<Guru[]>("/guru").then((res) => {
      setData(res.data);
      setLoading(false);
    });
  }, []);

  useEffect(() => { load(); }, [load]);

  function bukaTambah() {
    setEditing(null);
    setForm(emptyForm);
    setError(null);
    setModalOpen(true);
  }

  function mulaiEdit(g: Guru) {
    setEditing(g);
    setForm({ nama: g.nama, email: g.user.email, password: "", nip: g.nip ?? "", no_hp: g.no_hp ?? "" });
    setError(null);
    setModalOpen(true);
  }

  function tutupForm() {
    setModalOpen(false);
    setEditing(null);
    setForm(emptyForm);
    setError(null);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setCreating(true);
    setError(null);
    try {
      if (editing) {
        await api.put(`/guru/${editing.id}`, {
          nama: form.nama,
          no_hp: form.no_hp || null,
          is_aktif: editing.is_aktif,
        });
      } else {
        await api.post("/guru", {
          nama: form.nama,
          email: form.email,
          password: form.password,
          nip: form.nip || null,
          no_hp: form.no_hp || null,
        });
      }
      tutupForm();
      await load();
    } catch (err: unknown) {
      const pesan = (err as { response?: { data?: { message?: string } } })?.response?.data;
      setError(pesan?.message ?? "Gagal menyimpan guru.");
    } finally {
      setCreating(false);
    }
  }

  async function toggleAktif(g: Guru) {
    await api.put(`/guru/${g.id}`, { is_aktif: !g.is_aktif });
    await load();
  }

  async function handleHapus() {
    if (!hapus) return;
    setHapusLoading(true);
    setHapusError(null);
    try {
      await api.delete(`/guru/${hapus.id}`);
      setHapus(null);
      await load();
    } catch (err: unknown) {
      const pesan = (err as { response?: { data?: { message?: string } } })?.response?.data;
      setHapusError(pesan?.message ?? "Gagal menghapus guru.");
    } finally {
      setHapusLoading(false);
    }
  }

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Data Guru Pesantren"
        description="Menambahkan guru otomatis membuat akun login untuknya."
        action={<Button onClick={bukaTambah}>+ Tambah Guru</Button>}
      />

      {hapusError && (
        <div className="mb-6">
          <Alert variant="danger" onClose={() => setHapusError(null)}>{hapusError}</Alert>
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={tutupForm}
        title={editing ? `Edit Guru: ${editing.nama}` : "Tambah Guru Baru"}
        description={editing ? "Perbarui data guru." : "Guru baru otomatis mendapat akun login dengan email dan password di bawah."}
      >
        <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <Input
              label="Nama Lengkap"
              value={form.nama}
              onChange={(e) => setForm({ ...form, nama: e.target.value })}
              placeholder="Nama guru"
              required
            />
          </div>
          {!editing && (
            <>
              <Input
                label="Email Login"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="email@guru.id"
                required
              />
              <Input
                label="Password Awal"
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="Min 8 karakter"
                required
              />
            </>
          )}
          <Input
            label="NIP/NUPTK"
            value={form.nip}
            onChange={(e) => setForm({ ...form, nip: e.target.value })}
            disabled={!!editing}
            placeholder="Opsional"
            hint={editing ? "NIP tidak dapat diubah" : undefined}
          />
          <Input
            label="No. HP"
            value={form.no_hp}
            onChange={(e) => setForm({ ...form, no_hp: e.target.value })}
            placeholder="08xxx (opsional)"
          />
          {error && <p className="sm:col-span-2 text-sm text-red-600">{error}</p>}
          <div className="sm:col-span-2 flex justify-end gap-2 pt-1">
            <Button type="button" variant="outline" onClick={tutupForm}>Batal</Button>
            <Button type="submit" loading={creating}>
              {editing ? "Simpan Perubahan" : "Simpan Guru"}
            </Button>
          </div>
        </form>
      </Modal>

      {loading ? (
        <Skeleton className="h-40 w-full" />
      ) : data.length === 0 ? (
        <EmptyState
          title="Belum ada guru"
          description="Tambahkan guru pesantren baru melalui tombol di atas."
          action={<Button onClick={bukaTambah}>+ Tambah Guru</Button>}
        />
      ) : (
        <Card className="p-0">
          <Table>
            <TableHead>
              <Th>Nama</Th>
              <Th>Email</Th>
              <Th>NIP</Th>
              <Th>Status</Th>
              <Th className="text-right">Aksi</Th>
            </TableHead>
            <TableBody>
              {data.map((g) => (
                <TableRow key={g.id}>
                  <Td>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-emerald-500/10 text-emerald-700 flex items-center justify-center text-sm font-semibold shrink-0">
                        {g.nama.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-medium text-slate-800">{g.nama}</span>
                    </div>
                  </Td>
                  <Td className="text-slate-500">{g.user.email}</Td>
                  <Td className="font-mono text-xs">{g.nip ?? <span className="text-slate-400 font-sans">-</span>}</Td>
                  <Td>
                    <button
                      onClick={() => toggleAktif(g)}
                      title="Klik untuk mengubah status"
                      className="cursor-pointer"
                    >
                      <Badge variant={g.is_aktif ? "success" : "default"}>{g.is_aktif ? "Aktif" : "Nonaktif"}</Badge>
                    </button>
                  </Td>
                  <Td>
                    <div className="flex items-center justify-end gap-1">
                      <IconButton icon="edit" variant="edit" label="Edit guru" onClick={() => mulaiEdit(g)} />
                      <IconButton icon="trash" variant="delete" label="Hapus guru" onClick={() => { setHapus(g); setHapusError(null); }} />
                    </div>
                  </Td>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      <ConfirmModal
        open={hapus !== null}
        onClose={() => setHapus(null)}
        onConfirm={handleHapus}
        loading={hapusLoading}
        title="Hapus Guru"
        message={`Yakin ingin menghapus guru "${hapus?.nama}" beserta akun loginnya?`}
      />
    </div>
  );
}