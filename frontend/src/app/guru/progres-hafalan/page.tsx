"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { fetchSemuaSiswa } from "@/lib/siswa";
import {
  PageHeader, Card, Button, Input, Select, Skeleton, Alert, EmptyState, ConfirmModal, Badge, IconButton,
} from "@/components/ui";

interface Siswa {
  id: number;
  nama: string;
  nis: string;
}

interface MapelPlus {
  id: number;
  nama: string;
  punya_progres_hafalan: boolean;
}

interface Setoran {
  id: number;
  siswa_id: number;
  mapel_plus_id: number;
  tanggal_setoran: string;
  materi: string;
  status: string;
  catatan: string | null;
  dicatat_oleh: number;
  siswa?: Siswa | null;
  mapel_plus?: { id: number; nama: string } | null;
}

const FORM_KOSONG = {
  siswa_id: "",
  mapel_plus_id: "",
  tanggal_setoran: new Date().toISOString().slice(0, 10),
  materi: "",
  status: "Lancar",
  catatan: "",
};

const VARIAN_STATUS: Record<string, "success" | "warning" | "danger"> = {
  "Lancar": "success",
  "Perlu Perbaikan": "warning",
  "Mengulang": "danger",
};

export default function ProgresHafalanPage() {
  const { user } = useAuth();
  const [siswas, setSiswas] = useState<Siswa[]>([]);
  const [mapels, setMapels] = useState<MapelPlus[]>([]);
  const [form, setForm] = useState(FORM_KOSONG);
  const [editId, setEditId] = useState<number | null>(null);
  const [daftar, setDaftar] = useState<Setoran[]>([]);
  const [memuatDaftar, setMemuatDaftar] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hapus, setHapus] = useState<Setoran | null>(null);
  const [hapusLoading, setHapusLoading] = useState(false);

  // Ambil daftar setoran: semua setState terjadi dalam callback promise
  const ambilDaftar = useCallback(() => {
    return api.get<Setoran[]>("/progres-hafalan")
      .then((res) => {
        setDaftar(res.data.slice(0, 30));
      })
      .catch(() => {
        setDaftar([]);
      })
      .finally(() => {
        setMemuatDaftar(false);
      });
  }, []);

  // Refresh dari aksi user: tandai skeleton dulu agar daftar lama tak menggantung
  const muatDaftar = useCallback(() => {
    setMemuatDaftar(true);
    void ambilDaftar();
  }, [ambilDaftar]);

  useEffect(() => {
    Promise.all([
      fetchSemuaSiswa<Siswa>(),
      api.get<MapelPlus[]>("/mapel-plus"),
    ]).then(([siswaList, mapelRes]) => {
      setSiswas(siswaList);
      setMapels(mapelRes.data.filter((m) => m.punya_progres_hafalan));
    });
    void ambilDaftar();
  }, [ambilDaftar]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSavedMsg(null);
    setError(null);
    try {
      if (editId !== null) {
        await api.put(`/progres-hafalan/${editId}`, form);
        setSavedMsg("Setoran hafalan berhasil dikoreksi.");
      } else {
        await api.post("/progres-hafalan", form);
        setSavedMsg("Progres hafalan berhasil disimpan.");
      }
      setForm({ ...form, materi: "", catatan: "" });
      setEditId(null);
      muatDaftar();
    } catch (err: unknown) {
      const pesan = (err as { response?: { data?: { message?: string } } })?.response?.data;
      setError(pesan?.message ?? "Gagal menyimpan setoran hafalan.");
    } finally {
      setSaving(false);
    }
  }

  async function handleHapus() {
    if (!hapus) return;
    setHapusLoading(true);
    setError(null);
    try {
      await api.delete(`/progres-hafalan/${hapus.id}`);
      if (editId === hapus.id) setEditId(null);
      setHapus(null);
      muatDaftar();
    } catch (err: unknown) {
      const pesan = (err as { response?: { data?: { message?: string } } })?.response?.data;
      setError(pesan?.message ?? "Gagal menghapus setoran.");
    } finally {
      setHapusLoading(false);
    }
  }

  function mulaiEdit(s: Setoran) {
    setEditId(s.id);
    setForm({
      siswa_id: String(s.siswa_id),
      mapel_plus_id: String(s.mapel_plus_id),
      tanggal_setoran: s.tanggal_setoran?.slice(0, 10) ?? "",
      materi: s.materi,
      status: s.status,
      catatan: s.catatan ?? "",
    });
    setSavedMsg(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={editId !== null ? "Koreksi Setoran Hafalan" : "Catat Progres Hafalan"}
        description={editId !== null
          ? "Perbaiki detail setoran — nanti daftar di bawah ikut terbarui."
          : "Input setoran hafalan siswa untuk mapel Tahfidz/Tahsin. Catatan lama bisa dikoreksi."}
      />

      {error && (
        <div className="mb-6">
          <Alert variant="danger" onClose={() => setError(null)}>{error}</Alert>
        </div>
      )}

      <Card>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Select label="Siswa" value={form.siswa_id} onChange={(e) => setForm({ ...form, siswa_id: e.target.value })} required placeholder="Pilih siswa">
            {siswas.map((s) => (
              <option key={s.id} value={s.id}>{s.nama} (NIS {s.nis})</option>
            ))}
          </Select>

          <Select label="Mata Pelajaran" value={form.mapel_plus_id} onChange={(e) => setForm({ ...form, mapel_plus_id: e.target.value })} required placeholder="Pilih mapel">
            {mapels.map((m) => (
              <option key={m.id} value={m.id}>{m.nama}</option>
            ))}
          </Select>

          <div className="grid grid-cols-2 gap-3">
            <Input label="Tanggal Setoran" type="date" value={form.tanggal_setoran} onChange={(e) => setForm({ ...form, tanggal_setoran: e.target.value })} />
            <Select label="Status" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              <option value="Lancar">Lancar</option>
              <option value="Perlu Perbaikan">Perlu Perbaikan</option>
              <option value="Mengulang">Mengulang</option>
            </Select>
          </div>

          <Input label="Materi" value={form.materi} onChange={(e) => setForm({ ...form, materi: e.target.value })} placeholder="contoh: Juz 30 - An-Naba" required />

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-slate-700">Catatan (opsional)</label>
            <textarea
              value={form.catatan}
              onChange={(e) => setForm({ ...form, catatan: e.target.value })}
              placeholder="Catatan tambahan..."
              rows={3}
              className="w-full px-4 py-2.5 text-sm glass-input resize-none"
            />
          </div>

          <div className="flex items-center gap-3">
            <Button type="submit" loading={saving}>{editId !== null ? "Simpan Koreksi" : "Simpan Progres"}</Button>
            {editId !== null && (
              <Button type="button" variant="outline" onClick={() => { setEditId(null); setForm({ ...FORM_KOSONG, siswa_id: form.siswa_id, mapel_plus_id: form.mapel_plus_id }); }}>
                Batal Edit
              </Button>
            )}
            {savedMsg && <p className="text-sm text-emerald-600 font-medium animate-fade-in">{savedMsg}</p>}
          </div>
        </form>
      </Card>

      <h3 className="text-sm font-semibold text-slate-800 mt-8 mb-3">Setoran Terakhir</h3>
      {memuatDaftar ? (
        <Skeleton className="h-40 w-full" />
      ) : daftar.length === 0 ? (
        <EmptyState title="Belum ada setoran" description="Setoran hafalan yang tercatat akan tampil di sini." />
      ) : (
        <div className="space-y-3">
          {daftar.map((s) => {
            const bolehEdit = user?.role === "admin" || s.dicatat_oleh === user?.id;
            return (
              <Card key={s.id} className="p-0">
                <div className="flex items-center justify-between gap-3 px-5 py-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <p className="font-medium text-slate-800 truncate">{s.siswa?.nama ?? `Siswa #${s.siswa_id}`}</p>
                      <Badge variant={VARIAN_STATUS[s.status] ?? "default"}>{s.status}</Badge>
                    </div>
                    <p className="text-sm text-slate-600 mt-1 truncate">{s.materi}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {s.mapel_plus?.nama ?? "-"} • {s.tanggal_setoran ? new Date(s.tanggal_setoran).toLocaleDateString("id-ID") : "-"}
                      {s.catatan ? ` • ${s.catatan}` : ""}
                    </p>
                  </div>
                  {bolehEdit && (
                    <div className="flex items-center gap-1 shrink-0">
                      <IconButton icon="edit" variant="edit" label="Koreksi setoran" onClick={() => mulaiEdit(s)} />
                      <IconButton icon="trash" variant="delete" label="Hapus setoran" onClick={() => { setHapus(s); setError(null); }} />
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <ConfirmModal
        open={hapus !== null}
        onClose={() => setHapus(null)}
        onConfirm={handleHapus}
        loading={hapusLoading}
        title="Hapus Setoran Hafalan"
        message={`Yakin ingin menghapus setoran "${hapus?.materi}" milik ${hapus?.siswa?.nama ?? "siswa ini"}?`}
      />
    </div>
  );
}
