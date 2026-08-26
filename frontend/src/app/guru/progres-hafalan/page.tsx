"use client";

import { FormEvent, useEffect, useState } from "react";
import { api } from "@/lib/api";

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
  const [savedMsg, setSavedMsg] = useState<string | null>(null);

  useEffect(() => {
    api.get("/siswa").then((res) => setSiswas(res.data.data ?? res.data));
    api.get<MapelPlus[]>("/mapel-plus").then((res) =>
      setMapels(res.data.filter((m) => m.punya_progres_hafalan))
    );
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSavedMsg(null);
    await api.post("/progres-hafalan", form);
    setForm({ ...form, materi: "", catatan: "" });
    setSavedMsg("Progres hafalan tersimpan.");
  }

  return (
    <div>
      <h1 className="text-lg font-semibold">Catat Progres Hafalan</h1>

      <form onSubmit={handleSubmit} className="mt-4 grid max-w-lg gap-2">
        <select
          value={form.siswa_id}
          onChange={(e) => setForm({ ...form, siswa_id: e.target.value })}
          required
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
        >
          <option value="">Pilih siswa</option>
          {siswas.map((s) => (
            <option key={s.id} value={s.id}>
              {s.nama} ({s.nis})
            </option>
          ))}
        </select>

        <select
          value={form.mapel_plus_id}
          onChange={(e) => setForm({ ...form, mapel_plus_id: e.target.value })}
          required
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
        >
          <option value="">Pilih mapel (Tahfidz/Tahsin)</option>
          {mapels.map((m) => (
            <option key={m.id} value={m.id}>
              {m.nama}
            </option>
          ))}
        </select>

        <input
          type="date"
          value={form.tanggal_setoran}
          onChange={(e) => setForm({ ...form, tanggal_setoran: e.target.value })}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />

        <input
          value={form.materi}
          onChange={(e) => setForm({ ...form, materi: e.target.value })}
          placeholder="Materi (contoh: Juz 30 - An-Naba)"
          required
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />

        <select
          value={form.status}
          onChange={(e) => setForm({ ...form, status: e.target.value })}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
        >
          <option value="Lancar">Lancar</option>
          <option value="Perlu Perbaikan">Perlu Perbaikan</option>
          <option value="Mengulang">Mengulang</option>
        </select>

        <textarea
          value={form.catatan}
          onChange={(e) => setForm({ ...form, catatan: e.target.value })}
          placeholder="Catatan (opsional)"
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />

        <button className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700">
          Simpan
        </button>
      </form>
      {savedMsg && <p className="mt-2 text-sm text-emerald-600">{savedMsg}</p>}
    </div>
  );
}
