"use client";

import { FormEvent, useEffect, useState } from "react";
import { api } from "@/lib/api";

interface Siswa {
  id: number;
  nis: string;
  nama: string;
  jenis_kelamin: "L" | "P";
  kelas_rombel: { id: number; nama: string } | null;
}

interface KelasOption {
  id: number;
  nama: string;
}

export default function SiswaPage() {
  const [data, setData] = useState<Siswa[]>([]);
  const [kelasList, setKelasList] = useState<KelasOption[]>([]);
  const [form, setForm] = useState({ nis: "", nama: "", jenis_kelamin: "L", kelas_rombel_id: "" });
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const [siswaRes, kelasRes] = await Promise.all([
      api.get("/siswa"),
      api.get<KelasOption[]>("/kelas-rombel"),
    ]);
    setData(siswaRes.data.data ?? siswaRes.data);
    setKelasList(kelasRes.data);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    await api.post("/siswa", {
      ...form,
      kelas_rombel_id: form.kelas_rombel_id || null,
    });
    setForm({ nis: "", nama: "", jenis_kelamin: "L", kelas_rombel_id: "" });
    load();
  }

  return (
    <div>
      <h1 className="text-lg font-semibold">Data Siswa</h1>

      <form onSubmit={handleCreate} className="mt-4 flex flex-wrap gap-2">
        <input
          value={form.nis}
          onChange={(e) => setForm({ ...form, nis: e.target.value })}
          placeholder="NIS"
          required
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
        <input
          value={form.nama}
          onChange={(e) => setForm({ ...form, nama: e.target.value })}
          placeholder="Nama lengkap"
          required
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
        <select
          value={form.jenis_kelamin}
          onChange={(e) => setForm({ ...form, jenis_kelamin: e.target.value })}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
        >
          <option value="L">Laki-laki</option>
          <option value="P">Perempuan</option>
        </select>
        <select
          value={form.kelas_rombel_id}
          onChange={(e) => setForm({ ...form, kelas_rombel_id: e.target.value })}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
        >
          <option value="">Belum ada kelas</option>
          {kelasList.map((k) => (
            <option key={k.id} value={k.id}>
              {k.nama}
            </option>
          ))}
        </select>
        <button className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700">
          Tambah Siswa
        </button>
      </form>

      {loading ? (
        <p className="mt-6 text-sm text-gray-500">Memuat...</p>
      ) : (
        <table className="mt-6 w-full overflow-hidden rounded-xl border border-gray-200 bg-white text-sm">
          <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
            <tr>
              <th className="px-4 py-2">NIS</th>
              <th className="px-4 py-2">Nama</th>
              <th className="px-4 py-2">Kelas</th>
              <th className="px-4 py-2">L/P</th>
            </tr>
          </thead>
          <tbody>
            {data.map((s) => (
              <tr key={s.id} className="border-t border-gray-100">
                <td className="px-4 py-2">{s.nis}</td>
                <td className="px-4 py-2">{s.nama}</td>
                <td className="px-4 py-2">{s.kelas_rombel?.nama ?? "-"}</td>
                <td className="px-4 py-2">{s.jenis_kelamin}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
