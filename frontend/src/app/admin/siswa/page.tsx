"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import {
  PageHeader, Card, Button, Input, Select, Table, TableHead, TableBody, Th, Td, TableRow,
  Badge, Skeleton, EmptyState, Modal, ConfirmModal, IconButton, Alert,
} from "@/components/ui";

interface Siswa {
  id: number;
  nis: string;
  nama: string;
  jenis_kelamin: "L" | "P";
  is_aktif: boolean;
  kelas_rombel: { id: number; nama: string } | null;
}

interface KelasOption {
  id: number;
  nama: string;
}

interface PaginatedSiswa {
  data?: Siswa[];
  current_page?: number;
  last_page?: number;
  total?: number;
  from?: number | null;
  to?: number | null;
}

function pageNumbers(current: number, last: number): (number | "…")[] {
  if (last <= 7) return Array.from({ length: last }, (_, i) => i + 1);
  const set = new Set<number>([1, last, current - 1, current, current + 1]);
  const sorted = [...set].filter((p) => p >= 1 && p <= last).sort((a, b) => a - b);
  const out: (number | "…")[] = [];
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1] > 1) out.push("…");
    out.push(p);
  });
  return out;
}

const emptyForm = { nis: "", nama: "", jenis_kelamin: "L", kelas_rombel_id: "" };

export default function SiswaPage() {
  const [data, setData] = useState<Siswa[]>([]);
  const [kelasList, setKelasList] = useState<KelasOption[]>([]);
  const [meta, setMeta] = useState({ page: 1, lastPage: 1, total: 0, from: 0, to: 0 });
  const [searchInput, setSearchInput] = useState("");
  const [committedSearch, setCommittedSearch] = useState("");
  const [kelasFilter, setKelasFilter] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [hapus, setHapus] = useState<Siswa | null>(null);
  const [hapusLoading, setHapusLoading] = useState(false);
  const [hapusError, setHapusError] = useState<string | null>(null);

  const load = useCallback(() => {
    api.get("/siswa", {
      params: {
        page,
        search: committedSearch || undefined,
        kelas_rombel_id: kelasFilter || undefined,
      },
    }).then((res) => {
      const payload = res.data as Siswa[] | PaginatedSiswa;
      if (Array.isArray(payload)) {
        setData(payload);
        setMeta({ page: 1, lastPage: 1, total: payload.length, from: payload.length ? 1 : 0, to: payload.length });
      } else {
        const list = payload.data ?? [];
        setData(list);
        setMeta({
          page: payload.current_page ?? 1,
          lastPage: payload.last_page ?? 1,
          total: payload.total ?? list.length,
          from: payload.from ?? (list.length ? 1 : 0),
          to: payload.to ?? list.length,
        });
      }
      setLoading(false);
    });
  }, [page, committedSearch, kelasFilter]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    api.get<KelasOption[]>("/kelas-rombel").then((res) => setKelasList(res.data));
  }, []);

  function bukaTambah() {
    setEditingId(null);
    setForm(emptyForm);
    setFormError(null);
    setShowForm(true);
  }

  function tutupForm() {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
    setFormError(null);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setFormError(null);
    try {
      const body = {
        nama: form.nama,
        jenis_kelamin: form.jenis_kelamin,
        kelas_rombel_id: form.kelas_rombel_id || null,
      };
      if (editingId) {
        await api.put(`/siswa/${editingId}`, body);
      } else {
        await api.post("/siswa", { ...body, nis: form.nis });
      }
      tutupForm();
      await load();
    } catch (err: unknown) {
      const pesan = (err as { response?: { data?: { message?: string } } })?.response?.data;
      setFormError(pesan?.message ?? "Gagal menyimpan siswa.");
    } finally {
      setSaving(false);
    }
  }

  function mulaiEdit(s: Siswa) {
    setEditingId(s.id);
    setForm({
      nis: s.nis,
      nama: s.nama,
      jenis_kelamin: s.jenis_kelamin,
      kelas_rombel_id: s.kelas_rombel?.id ? String(s.kelas_rombel.id) : "",
    });
    setFormError(null);
    setShowForm(true);
  }

  async function handleHapus() {
    if (!hapus) return;
    setHapusLoading(true);
    setHapusError(null);
    try {
      await api.delete(`/siswa/${hapus.id}`);
      setHapus(null);
      await load();
    } catch (err: unknown) {
      const pesan = (err as { response?: { data?: { message?: string } } })?.response?.data;
      setHapusError(pesan?.message ?? "Gagal menghapus siswa.");
    } finally {
      setHapusLoading(false);
    }
  }

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Data Siswa"
        description="Kelola seluruh data siswa SMP Plus YPP Darussurur."
        action={<Button onClick={bukaTambah}>+ Tambah Siswa</Button>}
      />

      {hapusError && (
        <div className="mb-6">
          <Alert variant="danger" onClose={() => setHapusError(null)}>{hapusError}</Alert>
        </div>
      )}

      <Modal
        open={showForm}
        onClose={tutupForm}
        title={editingId ? "Edit Siswa" : "Tambah Siswa Baru"}
        description={editingId ? "Perbarui data siswa." : "Siswa baru akan masuk ke daftar kelas terpilih."}
      >
        <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="NIS"
            value={form.nis}
            onChange={(e) => setForm({ ...form, nis: e.target.value })}
            placeholder="Nomor Induk Siswa"
            required
            disabled={!!editingId}
            hint={editingId ? "NIS tidak dapat diubah" : undefined}
          />
          <Input
            label="Nama Lengkap"
            value={form.nama}
            onChange={(e) => setForm({ ...form, nama: e.target.value })}
            placeholder="Nama siswa"
            required
          />
          <Select
            label="Jenis Kelamin"
            value={form.jenis_kelamin}
            onChange={(e) => setForm({ ...form, jenis_kelamin: e.target.value })}
          >
            <option value="L">Laki-laki</option>
            <option value="P">Perempuan</option>
          </Select>
          <Select
            label="Kelas"
            value={form.kelas_rombel_id}
            onChange={(e) => setForm({ ...form, kelas_rombel_id: e.target.value })}
          >
            <option value="">Belum ada kelas</option>
            {kelasList.map((k) => (
              <option key={k.id} value={k.id}>{k.nama}</option>
            ))}
          </Select>
          {formError && <p className="sm:col-span-2 text-sm text-red-600">{formError}</p>}
          <div className="sm:col-span-2 flex justify-end gap-2 pt-1">
            <Button type="button" variant="outline" onClick={tutupForm}>Batal</Button>
            <Button type="submit" loading={saving}>
              {editingId ? "Simpan Perubahan" : "Simpan Siswa"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Filter */}
      <Card className="mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Cari nama atau NIS…"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  setCommittedSearch(searchInput);
                  setPage(1);
                }
              }}
            />
          </div>
          <div className="w-full sm:w-52">
            <Select
              value={kelasFilter}
              onChange={(e) => {
                setKelasFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="">Semua Kelas</option>
              {kelasList.map((k) => (
                <option key={k.id} value={k.id}>{k.nama}</option>
              ))}
            </Select>
          </div>
          <Button
            variant="outline"
            onClick={() => {
              setCommittedSearch(searchInput);
              setPage(1);
            }}
          >
            Cari
          </Button>
        </div>
      </Card>

      {loading ? (
        <Skeleton className="h-64 w-full" />
      ) : data.length === 0 ? (
        <EmptyState
          title="Belum ada siswa"
          description="Tambahkan siswa baru melalui tombol Tambah Siswa."
          action={<Button onClick={bukaTambah}>+ Tambah Siswa</Button>}
        />
      ) : (
        <Card className="p-0">
          <Table>
            <TableHead>
              <Th className="w-12">No</Th>
              <Th>Nama Siswa</Th>
              <Th>NIS</Th>
              <Th>Kelas</Th>
              <Th>Jenis Kelamin</Th>
              <Th>Status</Th>
              <Th className="text-right">Aksi</Th>
            </TableHead>
            <TableBody>
              {data.map((s, i) => (
                <TableRow key={s.id}>
                  <Td className="text-slate-400">{meta.from + i}</Td>
                  <Td>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-emerald-500/10 text-emerald-700 flex items-center justify-center text-sm font-semibold shrink-0">
                        {s.nama.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-medium text-slate-800">{s.nama}</span>
                    </div>
                  </Td>
                  <Td className="font-mono text-xs text-slate-500">{s.nis}</Td>
                  <Td>{s.kelas_rombel?.nama ?? <span className="text-slate-400">-</span>}</Td>
                  <Td className="text-slate-500">{s.jenis_kelamin === "L" ? "Laki-laki" : "Perempuan"}</Td>
                  <Td>
                    <Badge variant={s.is_aktif !== false ? "success" : "default"}>
                      {s.is_aktif !== false ? "Aktif" : "Nonaktif"}
                    </Badge>
                  </Td>
                  <Td>
                    <div className="flex items-center justify-end gap-1">
                      <IconButton icon="edit" variant="edit" label="Edit siswa" onClick={() => mulaiEdit(s)} />
                      <IconButton icon="trash" variant="delete" label="Hapus siswa" onClick={() => { setHapus(s); setHapusError(null); }} />
                    </div>
                  </Td>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Pagination */}
          <div className="px-4 py-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-sm text-slate-500">
              Menampilkan <span className="font-semibold text-slate-700">{meta.from}</span>–
              <span className="font-semibold text-slate-700">{meta.to}</span> dari{" "}
              <span className="font-semibold text-slate-700">{meta.total}</span> siswa
            </p>
            {meta.lastPage > 1 && (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={meta.page <= 1}
                  className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  aria-label="Halaman sebelumnya"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                  </svg>
                </button>
                {pageNumbers(meta.page, meta.lastPage).map((p, i) =>
                  p === "…" ? (
                    <span key={`e${i}`} className="w-8 h-8 flex items-center justify-center text-slate-400 text-sm">…</span>
                  ) : (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={`w-8 h-8 rounded-lg text-sm flex items-center justify-center transition-colors cursor-pointer ${
                        p === meta.page
                          ? "bg-emerald-600 text-white font-semibold"
                          : "text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      {p}
                    </button>
                  )
                )}
                <button
                  onClick={() => setPage((p) => Math.min(meta.lastPage, p + 1))}
                  disabled={meta.page >= meta.lastPage}
                  className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  aria-label="Halaman berikutnya"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                  </svg>
                </button>
              </div>
            )}
          </div>
        </Card>
      )}

      <ConfirmModal
        open={hapus !== null}
        onClose={() => setHapus(null)}
        onConfirm={handleHapus}
        loading={hapusLoading}
        title="Hapus Siswa"
        message={`Yakin ingin menghapus siswa "${hapus?.nama}"? Data nilai, presensi, dan rapor terkait juga akan terhapus.`}
      />
    </div>
  );
}