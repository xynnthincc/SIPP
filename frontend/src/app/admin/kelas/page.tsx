"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import {
  PageHeader, Card, Button, Input, Select, Table, TableHead, TableBody, Th, Td, TableRow,
  Badge, Skeleton, EmptyState, Modal, ConfirmModal, IconButton, Alert,
} from "@/components/ui";

interface KelasRombel {
  id: number;
  nama: string;
  tingkat: number;
  siswas_count: number;
  wali_kelas: { id: number; name: string } | null;
}

interface TahunAjaran {
  id: number;
  nama: string;
  is_aktif: boolean;
}

export default function KelasPage() {
  const [data, setData] = useState<KelasRombel[]>([]);
  const [tahunList, setTahunList] = useState<TahunAjaran[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<KelasRombel | null>(null);
  const [form, setForm] = useState({ nama: "", tingkat: "7", tahun_ajaran_id: "" });
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hapus, setHapus] = useState<KelasRombel | null>(null);
  const [hapusLoading, setHapusLoading] = useState(false);
  const [hapusError, setHapusError] = useState<string | null>(null);

  const load = useCallback(() => {
    Promise.all([api.get<KelasRombel[]>("/kelas-rombel"), api.get<TahunAjaran[]>("/tahun-ajaran")]).then(
      ([kelasRes, taRes]) => {
        setData(kelasRes.data);
        const aktif = taRes.data.find((t) => t.is_aktif);
        setTahunList(taRes.data);
        setForm((f) => ({ ...f, tahun_ajaran_id: f.tahun_ajaran_id || String(aktif?.id ?? "") }));
        setLoading(false);
      }
    );
  }, []);

  useEffect(() => { load(); }, [load]);

  function bukaTambah() {
    setEditing(null);
    setForm({
      nama: "",
      tingkat: "7",
      tahun_ajaran_id: String(tahunList.find((t) => t.is_aktif)?.id ?? tahunList[0]?.id ?? ""),
    });
    setError(null);
    setModalOpen(true);
  }

  function mulaiEdit(k: KelasRombel) {
    setEditing(k);
    setForm({ nama: k.nama, tingkat: String(k.tingkat), tahun_ajaran_id: "" });
    setError(null);
    setModalOpen(true);
  }

  function tutupForm() {
    setModalOpen(false);
    setEditing(null);
    setError(null);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setCreating(true);
    setError(null);
    try {
      if (editing) {
        await api.put(`/kelas-rombel/${editing.id}`, { nama: form.nama, tingkat: Number(form.tingkat) });
      } else {
        await api.post("/kelas-rombel", {
          nama: form.nama,
          tingkat: Number(form.tingkat),
          tahun_ajaran_id: Number(form.tahun_ajaran_id),
        });
      }
      tutupForm();
      await load();
    } catch (err: unknown) {
      const pesan = (err as { response?: { data?: { message?: string } } })?.response?.data;
      setError(pesan?.message ?? "Gagal menyimpan kelas.");
    } finally {
      setCreating(false);
    }
  }

  async function handleHapus() {
    if (!hapus) return;
    setHapusLoading(true);
    setHapusError(null);
    try {
      await api.delete(`/kelas-rombel/${hapus.id}`);
      setHapus(null);
      await load();
    } catch (err: unknown) {
      const pesan = (err as { response?: { data?: { message?: string } } })?.response?.data;
      setHapusError(pesan?.message ?? "Gagal menghapus kelas.");
    } finally {
      setHapusLoading(false);
    }
  }

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Kelas / Rombel"
        description="Kelola rombel dan penugasan wali kelas."
        action={<Button onClick={bukaTambah}>+ Tambah Kelas</Button>}
      />

      {hapusError && (
        <div className="mb-6">
          <Alert variant="danger" onClose={() => setHapusError(null)}>{hapusError}</Alert>
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={tutupForm}
        title={editing ? `Edit Kelas: ${editing.nama}` : "Tambah Kelas Baru"}
        description={editing ? "Perbarui data kelas." : "Kelas baru dibuat pada tahun ajaran terpilih."}
        maxWidth="sm"
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label="Nama Kelas"
            value={form.nama}
            onChange={(e) => setForm({ ...form, nama: e.target.value })}
            placeholder="contoh: VII-A"
            required
          />
          <Select
            label="Tingkat"
            value={form.tingkat}
            onChange={(e) => setForm({ ...form, tingkat: e.target.value })}
          >
            <option value="7">Tingkat 7</option>
            <option value="8">Tingkat 8</option>
            <option value="9">Tingkat 9</option>
          </Select>
          {!editing && (
            <Select
              label="Tahun Ajaran"
              value={form.tahun_ajaran_id}
              onChange={(e) => setForm({ ...form, tahun_ajaran_id: e.target.value })}
            >
              {tahunList.map((t) => (
                <option key={t.id} value={String(t.id)}>
                  {t.nama}{t.is_aktif ? " (Aktif)" : ""}
                </option>
              ))}
            </Select>
          )}
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="outline" onClick={tutupForm}>Batal</Button>
            <Button type="submit" loading={creating}>
              {editing ? "Simpan Perubahan" : "Simpan Kelas"}
            </Button>
          </div>
        </form>
      </Modal>

      {loading ? (
        <Skeleton className="h-40 w-full" />
      ) : data.length === 0 ? (
        <EmptyState
          title="Belum ada kelas"
          description="Buat kelas/rombel baru melalui tombol di atas."
          action={<Button onClick={bukaTambah}>+ Tambah Kelas</Button>}
        />
      ) : (
        <Card className="p-0">
          <Table>
            <TableHead>
              <Th>Kelas</Th>
              <Th>Tingkat</Th>
              <Th>Wali Kelas</Th>
              <Th>Jumlah Siswa</Th>
              <Th className="text-right">Aksi</Th>
            </TableHead>
            <TableBody>
              {data.map((k) => (
                <TableRow key={k.id}>
                  <Td className="font-medium text-slate-800">{k.nama}</Td>
                  <Td>
                    <Badge variant="info">Tingkat {k.tingkat}</Badge>
                  </Td>
                  <Td>{k.wali_kelas?.name ?? <span className="text-slate-400">-</span>}</Td>
                  <Td>
                    <span className="font-semibold text-slate-700">{k.siswas_count}</span>
                    <span className="text-slate-400"> siswa</span>
                  </Td>
                  <Td>
                    <div className="flex items-center justify-end gap-1">
                      <IconButton icon="edit" variant="edit" label="Edit kelas" onClick={() => mulaiEdit(k)} />
                      <IconButton icon="trash" variant="delete" label="Hapus kelas" onClick={() => { setHapus(k); setHapusError(null); }} />
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
        title="Hapus Kelas"
        message={`Yakin ingin menghapus kelas "${hapus?.nama}"? Siswa di kelas ini tidak ikut terhapus.`}
      />
    </div>
  );
}