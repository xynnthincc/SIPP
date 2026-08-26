"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

interface Rapor {
  id: number;
  status: string;
  catatan_wali_kelas: string | null;
  siswa: { nis: string; nama: string; kelas_rombel: { nama: string } | null };
}

export default function ValidasiRaporPage() {
  const [diajukan, setDiajukan] = useState<Rapor[]>([]);
  const [divalidasi, setDivalidasi] = useState<Rapor[]>([]);

  async function load() {
    const [a, b] = await Promise.all([
      api.get<Rapor[]>("/rapors", { params: { status: "Diajukan" } }),
      api.get<Rapor[]>("/rapors", { params: { status: "Divalidasi" } }),
    ]);
    setDiajukan(a.data);
    setDivalidasi(b.data);
  }

  useEffect(() => {
    load();
  }, []);

  async function validasi(id: number, disetujui: boolean) {
    await api.post(`/rapors/${id}/validasi`, { disetujui });
    load();
  }

  async function terbitkan(id: number) {
    await api.post(`/rapors/${id}/terbitkan`);
    load();
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-lg font-semibold">Rapor Menunggu Validasi</h1>
        <div className="mt-4 space-y-2">
          {diajukan.length === 0 && <p className="text-sm text-gray-500">Tidak ada rapor yang menunggu.</p>}
          {diajukan.map((r) => (
            <div key={r.id} className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-4 text-sm">
              <div>
                <p className="font-medium">
                  {r.siswa.nama} <span className="text-gray-400">({r.siswa.nis})</span>
                </p>
                <p className="text-gray-500">{r.siswa.kelas_rombel?.nama}</p>
                {r.catatan_wali_kelas && (
                  <p className="mt-1 text-xs italic text-gray-400">"{r.catatan_wali_kelas}"</p>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => validasi(r.id, true)}
                  className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700"
                >
                  Setujui
                </button>
                <button
                  onClick={() => validasi(r.id, false)}
                  className="rounded-lg bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-100"
                >
                  Tolak
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold">Siap Diterbitkan</h2>
        <div className="mt-4 space-y-2">
          {divalidasi.length === 0 && <p className="text-sm text-gray-500">Tidak ada rapor.</p>}
          {divalidasi.map((r) => (
            <div key={r.id} className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-4 text-sm">
              <p className="font-medium">
                {r.siswa.nama} <span className="text-gray-400">({r.siswa.nis})</span>
              </p>
              <button
                onClick={() => terbitkan(r.id)}
                className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
              >
                Terbitkan
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
