"use client";

import { FormEvent, useEffect, useState } from "react";
import { api } from "@/lib/api";

interface KelasRombel {
  id: number;
  nama: string;
  tingkat: number;
  siswas_count: number;
  wali_kelas: { id: number; name: string } | null;
}

export default function KelasPage() {
  const [data, setData] = useState<KelasRombel[]>([]);
  const [nama, setNama] = useState("");
  const [tingkat, setTingkat] = useState(7);
  const [tahunAjaranId, setTahunAjaranId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const [kelasRes, taRes] = await Promise.all([
      api.get<KelasRombel[]>("/kelas-rombel"),
      api.get("/tahun-ajaran"),
    ]);
    setData(kelasRes.data);
    const aktif = taRes.data.find((t: any) => t.is_aktif);
    if (aktif) setTahunAjaranId(aktif.id);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    if (!tahunAjaranId) {
      alert("Aktifkan tahun ajaran terlebih dahulu di menu Tahun Ajaran.");
      return;
    }
    await api.post("/kelas-rombel", { nama, tingkat, tahun_ajaran_id: tahunAjaranId });
    setNama("");
    load();
  }

  return (
    <div>
      <h1 className="text-lg font-semibold">Kelas / Rombel</h1>

      <form onSubmit={handleCreate} className="mt-4 flex flex-wrap gap-2">
        <input
          value={nama}
          onChange={(e) => setNama(e.target.value)}
          placeholder="contoh: VII-A"
          required
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
        <select
          value={tingkat}
          onChange={(e) => setTingkat(Number(e.target.value))}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
        >
          <option value={7}>Tingkat 7</option>
          <option value={8}>Tingkat 8</option>
          <option value={9}>Tingkat 9</option>
        </select>
        <button className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700">
          Tambah Kelas
        </button>
      </form>

      {loading ? (
        <p className="mt-6 text-sm text-gray-500">Memuat...</p>
      ) : (
        <table className="mt-6 w-full overflow-hidden rounded-xl border border-gray-200 bg-white text-sm">
          <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
            <tr>
              <th className="px-4 py-2">Kelas</th>
              <th className="px-4 py-2">Tingkat</th>
              <th className="px-4 py-2">Wali Kelas</th>
              <th className="px-4 py-2">Jumlah Siswa</th>
            </tr>
          </thead>
          <tbody>
            {data.map((k) => (
              <tr key={k.id} className="border-t border-gray-100">
                <td className="px-4 py-2">{k.nama}</td>
                <td className="px-4 py-2">{k.tingkat}</td>
                <td className="px-4 py-2">{k.wali_kelas?.name ?? "-"}</td>
                <td className="px-4 py-2">{k.siswas_count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
