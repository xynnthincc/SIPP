"use client";

import { FormEvent, useEffect, useState } from "react";
import { api } from "@/lib/api";

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

export default function TahunAjaranPage() {
  const [data, setData] = useState<TahunAjaran[]>([]);
  const [nama, setNama] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const res = await api.get<TahunAjaran[]>("/tahun-ajaran");
    setData(res.data);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await api.post("/tahun-ajaran", { nama });
      setNama("");
      load();
    } catch (err: any) {
      setError(err.response?.data?.message ?? "Gagal menyimpan.");
    }
  }

  async function toggleAktif(item: TahunAjaran) {
    await api.put(`/tahun-ajaran/${item.id}`, { is_aktif: !item.is_aktif });
    load();
  }

  async function toggleSemester(semester: Semester, field: "is_aktif" | "penilaian_dibuka") {
    await api.put(`/semester/${semester.id}`, { [field]: !semester[field] });
    load();
  }

  return (
    <div>
      <h1 className="text-lg font-semibold">Tahun Ajaran & Semester</h1>

      <form onSubmit={handleCreate} className="mt-4 flex gap-2">
        <input
          value={nama}
          onChange={(e) => setNama(e.target.value)}
          placeholder="contoh: 2026/2027"
          required
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
        <button className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700">
          Tambah Tahun Ajaran
        </button>
      </form>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

      {loading ? (
        <p className="mt-6 text-sm text-gray-500">Memuat...</p>
      ) : (
        <div className="mt-6 space-y-4">
          {data.map((ta) => (
            <div key={ta.id} className="rounded-xl border border-gray-200 bg-white p-4">
              <div className="flex items-center justify-between">
                <p className="font-medium">{ta.nama}</p>
                <button
                  onClick={() => toggleAktif(ta)}
                  className={`rounded-full px-3 py-1 text-xs font-medium ${
                    ta.is_aktif
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {ta.is_aktif ? "Aktif" : "Nonaktif"}
                </button>
              </div>

              <div className="mt-3 space-y-2">
                {ta.semesters?.map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 text-sm"
                  >
                    <span>Semester {s.nama}</span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => toggleSemester(s, "is_aktif")}
                        className={`rounded-full px-2 py-0.5 text-xs ${
                          s.is_aktif ? "bg-emerald-100 text-emerald-700" : "bg-gray-200 text-gray-600"
                        }`}
                      >
                        {s.is_aktif ? "Aktif" : "Nonaktif"}
                      </button>
                      <button
                        onClick={() => toggleSemester(s, "penilaian_dibuka")}
                        className={`rounded-full px-2 py-0.5 text-xs ${
                          s.penilaian_dibuka ? "bg-blue-100 text-blue-700" : "bg-gray-200 text-gray-600"
                        }`}
                      >
                        {s.penilaian_dibuka ? "Penilaian Dibuka" : "Penilaian Ditutup"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
