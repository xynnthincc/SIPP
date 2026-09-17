"use client";

import { FormEvent, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { PageHeader, Card, Button, Input, Select, Skeleton } from "@/components/ui";

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

export default function ProgresHafalanPage() {
  const [siswas, setSiswas] = useState<Siswa[]>([]);
  const [mapels, setMapels] = useState<MapelPlus[]>([]);
  const [form, setForm] = useState({
    siswa_id: "",
    mapel_plus_id: "",
    tanggal_setoran: new Date().toISOString().slice(0, 10),
    materi: "",
    status: "Lancar",
    catatan: "",
  });
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get("/siswa"),
      api.get<MapelPlus[]>("/mapel-plus"),
    ]).then(([siswaRes, mapelRes]) => {
      setSiswas(siswaRes.data.data ?? siswaRes.data);
      setMapels(mapelRes.data.filter((m) => m.punya_progres_hafalan));
      setLoading(false);
    });
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSavedMsg(null);
    await api.post("/progres-hafalan", form);
    setForm({ ...form, materi: "", catatan: "" });
    setSaving(false);
    setSavedMsg("Progres hafalan berhasil disimpan.");
  }

  return (
    <div className="animate-fade-in">
      <PageHeader title="Catat Progres Hafalan" description="Input setoran hafalan siswa untuk mapel Tahfidz/Tahsin." />

      {loading ? (
        <Skeleton className="h-60 w-full" />
      ) : (
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

            <Button type="submit" loading={saving}>Simpan Progres</Button>
            {savedMsg && <p className="text-sm text-emerald-600 font-medium animate-fade-in">{savedMsg}</p>}
          </form>
        </Card>
      )}
    </div>
  );
}
