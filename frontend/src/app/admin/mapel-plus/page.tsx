"use client";

import { FormEvent, useEffect, useState } from "react";
import { api } from "@/lib/api";

interface MapelPlus {
  id: number;
  kode: string;
  nama: string;
  punya_progres_hafalan: boolean;
  jenis_assessments_count: number;
}

export default function MapelPlusPage() {
  const [data, setData] = useState<MapelPlus[]>([]);
  const [form, setForm] = useState({ kode: "", nama: "", punya_progres_hafalan: false });
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const res = await api.get<MapelPlus[]>("/mapel-plus");
    setData(res.data);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    await api.post("/mapel-plus", form);
    setForm({ kode: "", nama: "", punya_progres_hafalan: false });
    load();
  }

  return (
    <div>
      <h1 className="text-lg font-semibold">Mata Pelajaran Plus</h1>
      <p className="mt-1 text-sm text-gray-500">
        Mata pelajaran kepesantrenan seperti Tahfidz, Tahsin, Kitab Kuning, Bahasa Arab, Akhlak.
      </p>

      <form onSubmit={handleCreate} className="mt-4 flex flex-wrap items-center gap-2">
        <input
          value={form.kode}
          onChange={(e) => setForm({ ...form, kode: e.target.value.toUpperCase() })}
          placeholder="Kode (contoh: TAHFIDZ)"
          required
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
        <input
          value={form.nama}
          onChange={(e) => setForm({ ...form, nama: e.target.value })}
          placeholder="Nama mata pelajaran"
          required
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
        <label className="flex items-center gap-2 text-sm text-gray-600">
          <input
            type="checkbox"
            checked={form.punya_progres_hafalan}
            onChange={(e) => setForm({ ...form, punya_progres_hafalan: e.target.checked })}
          />
          Punya tracker hafalan
        </label>
        <button className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700">
          Tambah
        </button>
      </form>

      {loading ? (
        <p className="mt-6 text-sm text-gray-500">Memuat...</p>
      ) : (
        <table className="mt-6 w-full overflow-hidden rounded-xl border border-gray-200 bg-white text-sm">
          <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
            <tr>
              <th className="px-4 py-2">Kode</th>
              <th className="px-4 py-2">Nama</th>
              <th className="px-4 py-2">Jenis Assessment</th>
              <th className="px-4 py-2">Tracker Hafalan</th>
            </tr>
          </thead>
          <tbody>
            {data.map((m) => (
              <tr key={m.id} className="border-t border-gray-100">
                <td className="px-4 py-2">{m.kode}</td>
                <td className="px-4 py-2">{m.nama}</td>
                <td className="px-4 py-2">{m.jenis_assessments_count}</td>
                <td className="px-4 py-2">{m.punya_progres_hafalan ? "Ya" : "Tidak"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
