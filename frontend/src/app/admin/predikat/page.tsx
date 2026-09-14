"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import {
  PageHeader, Card, Button, Input, Table, TableHead, TableBody, Th, Td, TableRow,
  Badge, Skeleton, EmptyState, Modal, ConfirmModal, IconButton, Alert,
} from "@/components/ui";

interface PredikatRange {
  id: number;
  nama: string;
  nilai_min: number;
  nilai_max: number;
}

export default function PredikatPage() {
  const [data, setData] = useState<PredikatRange[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<PredikatRange | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [hapus, setHapus] = useState<PredikatRange | null>(null);
  const [hapusLoading, setHapusLoading] = useState(false);
  const [hapusError, setHapusError] = useState<string | null>(null);
  const [form, setForm] = useState({ nama: "", nilai_min: "", nilai_max: "" });

  const load = useCallback(() => {
    api.get<PredikatRange[]>("/predikat-range").then((res) => {
      setData(res.data);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function bukaTambah() {
    setEditing(null);
    setForm({ nama: "", nilai_min: "", nilai_max: "" });
    setError("");
    setShowForm(true);
  }

  function mulaiEdit(p: PredikatRange) {
    setEditing(p);
    setForm({ nama: p.nama, nilai_min: String(p.nilai_min), nilai_max: String(p.nilai_max) });
    setError("");
    setShowForm(true);
  }

  function tutupForm() {
    setShowForm(false);
    setEditing(null);
    setError("");
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const body = {
        nama: form.nama,
        nilai_min: Number(form.nilai_min),
        nilai_max: Number(form.nilai_max),
      };
      if (editing) {
        await api.put(`/predikat-range/${editing.id}`, body);
      } else {
        await api.post("/predikat-range", body);
      }
      tutupForm();
      await load();
    } catch (err: unknown) {
      const pesan =
        (err as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } })
          ?.response?.data;
      setError(pesan?.errors ? Object.values(pesan.errors)[0][0] : (pesan?.message ?? "Gagal menyimpan."));
    } finally {
      setSaving(false);
    }
  }

  async function handleHapus() {
    if (!hapus) return;
    setHapusLoading(true);
    setHapusError(null);
    try {
      await api.delete(`/predikat-range/${hapus.id}`);
      setHapus(null);
      await load();
    } catch (err: unknown) {
      const pesan = (err as { response?: { data?: { message?: string } } })?.response?.data;
      setHapusError(pesan?.message ?? "Gagal menghapus predikat.");
    } finally {
      setHapusLoading(false);
    }
  }

  return (
    <div className="animate-fade-in max-w-4xl mx-auto">
      <PageHeader
        title="Rentang Predikat"
        description="Konversi nilai akhir ke predikat rapor (pola e-rapor Kurikulum Merdeka)."
        action={<Button onClick={bukaTambah}>+ Tambah Predikat</Button>}
      />

      {hapusError && (
        <div className="mb-6">
          <Alert variant="danger" onClose={() => setHapusError(null)}>{hapusError}</Alert>
        </div>
      )}

      <Modal
        open={showForm}
        onClose={tutupForm}
        title={editing ? `Edit Predikat: ${editing.nama}` : "Tambah Predikat Baru"}
        description="Rentang nilai digunakan untuk mengonversi nilai akhir menjadi predikat rapor."
        maxWidth="sm"
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label="Nama Predikat"
            value={form.nama}
            onChange={(e) => setForm({ ...form, nama: e.target.value })}
            placeholder="Sangat Baik"
            required
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Nilai Minimal"
              type="number"
              min={0}
              max={100}
              step="0.01"
              value={form.nilai_min}
              onChange={(e) => setForm({ ...form, nilai_min: e.target.value })}
              placeholder="86"
              required
            />
            <Input
              label="Nilai Maksimal"
              type="number"
              min={0}
              max={100}
              step="0.01"
              value={form.nilai_max}
              onChange={(e) => setForm({ ...form, nilai_max: e.target.value })}
              placeholder="100"
              required
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="outline" onClick={tutupForm}>Batal</Button>
            <Button type="submit" loading={saving}>
              {editing ? "Simpan Perubahan" : "Simpan Predikat"}
            </Button>
          </div>
        </form>
      </Modal>

      {loading ? (
        <Skeleton className="h-40 w-full" />
      ) : data.length === 0 ? (
        <EmptyState
          title="Belum ada rentang predikat"
          description="Tambahkan rentang predikat untuk konversi nilai akhir ke predikat rapor."
          action={<Button onClick={bukaTambah}>+ Tambah Predikat</Button>}
        />
      ) : (
        <Card className="p-0">
          <Table>
            <TableHead>
              <Th>Nama Predikat</Th>
              <Th>Rentang Nilai</Th>
              <Th className="text-right">Aksi</Th>
            </TableHead>
            <TableBody>
              {data.map((p) => (
                <TableRow key={p.id}>
                  <Td>
                    <Badge variant="success">{p.nama}</Badge>
                  </Td>
                  <Td className="text-slate-600">
                    {Number(p.nilai_min)} – {Number(p.nilai_max)}
                  </Td>
                  <Td>
                    <div className="flex items-center justify-end gap-1">
                      <IconButton icon="edit" variant="edit" label="Edit predikat" onClick={() => mulaiEdit(p)} />
                      <IconButton icon="trash" variant="delete" label="Hapus predikat" onClick={() => { setHapus(p); setHapusError(null); }} />
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
        title="Hapus Predikat"
        message={`Yakin ingin menghapus rentang predikat "${hapus?.nama}"? Rapor yang sudah memakai predikat ini tidak berubah.`}
      />
    </div>
  );
}