"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import {
  PageHeader, Card, Button, Input, Skeleton, Modal, ConfirmModal, IconButton, Alert, EmptyState,
} from "@/components/ui";

interface Semester {
  id: number;
  nama: "Ganjil" | "Genap";
  is_aktif: boolean;
  penilaian_dibuka: boolean;
}

interface TahunAjaran {
  id: number;
  nama: string;
  is_aktif: boolean;
  semesters: Semester[];
}

function TogglePill({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors cursor-pointer ${
        active
          ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
          : "bg-slate-50 text-slate-400 border-slate-200 hover:bg-slate-100 hover:text-slate-600"
      }`}
    >
      {label}
    </button>
  );
}

export default function TahunAjaranPage() {
  const [data, setData] = useState<TahunAjaran[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<TahunAjaran | null>(null);
  const [nama, setNama] = useState("");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [hapusTA, setHapusTA] = useState<TahunAjaran | null>(null);
  const [hapusSemester, setHapusSemester] = useState<{ ta: TahunAjaran; semester: Semester } | null>(null);
  const [hapusLoading, setHapusLoading] = useState(false);
  const [hapusError, setHapusError] = useState<string | null>(null);

  const load = useCallback(() => {
    api.get<TahunAjaran[]>("/tahun-ajaran").then((res) => {
      setData(res.data);
      setLoading(false);
    });
  }, []);

  useEffect(() => { load(); }, [load]);

  function bukaTambah() {
    setEditing(null);
    setNama("");
    setFormError(null);
    setModalOpen(true);
  }

  function mulaiEdit(ta: TahunAjaran) {
    setEditing(ta);
    setNama(ta.nama);
    setFormError(null);
    setModalOpen(true);
  }

  function tutupForm() {
    setModalOpen(false);
    setEditing(null);
    setNama("");
    setFormError(null);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setFormError(null);
    try {
      if (editing) {
        await api.put(`/tahun-ajaran/${editing.id}`, { nama });
      } else {
        await api.post("/tahun-ajaran", { nama });
      }
      tutupForm();
      await load();
    } catch (err: unknown) {
      const pesan = (err as { response?: { data?: { message?: string } } })?.response?.data;
      setFormError(pesan?.message ?? "Gagal menyimpan.");
    } finally {
      setSaving(false);
    }
  }

  async function toggleAktif(item: TahunAjaran) {
    await api.put(`/tahun-ajaran/${item.id}`, { is_aktif: !item.is_aktif });
    await load();
  }

  async function toggleSemester(semester: Semester, field: "is_aktif" | "penilaian_dibuka") {
    await api.put(`/semester/${semester.id}`, { [field]: !semester[field] });
    await load();
  }

  async function handleHapusTA() {
    if (!hapusTA) return;
    setHapusLoading(true);
    setHapusError(null);
    try {
      await api.delete(`/tahun-ajaran/${hapusTA.id}`);
      setHapusTA(null);
      await load();
    } catch (err: unknown) {
      const pesan = (err as { response?: { data?: { message?: string } } })?.response?.data;
      setHapusError(pesan?.message ?? "Gagal menghapus tahun ajaran.");
    } finally {
      setHapusLoading(false);
    }
  }

  async function handleHapusSemester() {
    if (!hapusSemester) return;
    setHapusLoading(true);
    setHapusError(null);
    try {
      await api.delete(`/semester/${hapusSemester.semester.id}`);
      setHapusSemester(null);
      await load();
    } catch (err: unknown) {
      const pesan = (err as { response?: { data?: { message?: string } } })?.response?.data;
      setHapusError(pesan?.message ?? "Gagal menghapus semester.");
    } finally {
      setHapusLoading(false);
    }
  }

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Tahun Ajaran & Semester"
        description="Atur tahun ajaran dan periode penilaian."
        action={<Button onClick={bukaTambah}>+ Tambah Tahun Ajaran</Button>}
      />

      {hapusError && (
        <div className="mb-6">
          <Alert variant="danger" onClose={() => setHapusError(null)}>{hapusError}</Alert>
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={tutupForm}
        title={editing ? `Edit Tahun Ajaran: ${editing.nama}` : "Tambah Tahun Ajaran"}
        description="Tahun ajaran baru otomatis dibuat dengan semester Ganjil dan Genap."
        maxWidth="sm"
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label="Nama Tahun Ajaran"
            value={nama}
            onChange={(e) => setNama(e.target.value)}
            placeholder="contoh: 2026/2027"
            required
          />
          {formError && <p className="text-sm text-red-600">{formError}</p>}
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="outline" onClick={tutupForm}>Batal</Button>
            <Button type="submit" loading={saving}>
              {editing ? "Simpan Perubahan" : "Simpan"}
            </Button>
          </div>
        </form>
      </Modal>

      {loading ? (
        <Skeleton className="h-40 w-full" />
      ) : data.length === 0 ? (
        <EmptyState
          title="Belum ada tahun ajaran"
          description="Tambahkan tahun ajaran untuk mulai mengelola kelas dan penilaian."
          action={<Button onClick={bukaTambah}>+ Tambah Tahun Ajaran</Button>}
        />
      ) : (
        <div className="space-y-4">
          {data.map((ta) => (
            <Card key={ta.id}>
              <div className="flex items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-3">
                  <h3 className="text-lg font-semibold text-slate-800">{ta.nama}</h3>
                  <TogglePill
                    active={ta.is_aktif}
                    onClick={() => toggleAktif(ta)}
                    label={ta.is_aktif ? "Aktif" : "Nonaktif"}
                  />
                </div>
                <div className="flex items-center gap-1">
                  <IconButton icon="edit" variant="edit" label="Edit tahun ajaran" onClick={() => mulaiEdit(ta)} />
                  <IconButton icon="trash" variant="delete" label="Hapus tahun ajaran" onClick={() => { setHapusTA(ta); setHapusError(null); }} />
                </div>
              </div>

              <div className="space-y-2">
                {ta.semesters?.map((s) => (
                  <div
                    key={s.id}
                    className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl bg-slate-50/70 border border-slate-100"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-slate-700">Semester {s.nama}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <TogglePill
                        active={s.is_aktif}
                        onClick={() => toggleSemester(s, "is_aktif")}
                        label={s.is_aktif ? "Berjalan" : "Nonaktif"}
                      />
                      <TogglePill
                        active={s.penilaian_dibuka}
                        onClick={() => toggleSemester(s, "penilaian_dibuka")}
                        label={s.penilaian_dibuka ? "Penilaian Dibuka" : "Penilaian Ditutup"}
                      />
                      <IconButton
                        icon="trash"
                        variant="delete"
                        label="Hapus semester"
                        onClick={() => { setHapusSemester({ ta, semester: s }); setHapusError(null); }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}

      <ConfirmModal
        open={hapusTA !== null}
        onClose={() => setHapusTA(null)}
        onConfirm={handleHapusTA}
        loading={hapusLoading}
        title="Hapus Tahun Ajaran"
        message={`Yakin ingin menghapus tahun ajaran "${hapusTA?.nama}" beserta semesternya?`}
      />
      <ConfirmModal
        open={hapusSemester !== null}
        onClose={() => setHapusSemester(null)}
        onConfirm={handleHapusSemester}
        loading={hapusLoading}
        title="Hapus Semester"
        message={`Yakin ingin menghapus semester ${hapusSemester?.semester.nama} dari tahun ajaran ${hapusSemester?.ta.nama}?`}
      />
    </div>
  );
}