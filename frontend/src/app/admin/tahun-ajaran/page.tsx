"use client";

import { FormEvent, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { PageHeader, Card, Button, Input, Badge, Skeleton, Modal } from "@/components/ui";

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
  const [creating, setCreating] = useState(false);

  async function load() {
    setLoading(true);
    const res = await api.get<TahunAjaran[]>("/tahun-ajaran");
    setData(res.data);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setCreating(true);
    try {
      await api.post("/tahun-ajaran", { nama });
      setNama("");
      load();
    } catch (err: any) {
      setError(err.response?.data?.message ?? "Gagal menyimpan.");
    } finally {
      setCreating(false);
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
    <div className="animate-fade-in">
      <PageHeader title="Tahun Ajaran & Semester" description="Atur tahun ajaran dan periode penilaian." />

      <Card className="mb-6">
        <form onSubmit={handleCreate} className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <Input
              value={nama}
              onChange={(e) => setNama(e.target.value)}
              placeholder="contoh: 2026/2027"
              required
            />
          </div>
          <Button type="submit" loading={creating}>
            Tambah Tahun Ajaran
          </Button>
        </form>
        {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
      </Card>

      {loading ? (
        <Skeleton className="h-40 w-full" />
      ) : (
        <div className="space-y-4">
          {data.map((ta) => (
            <Card key={ta.id}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-slate-800">{ta.nama}</h3>
                <button
                  onClick={() => toggleAktif(ta)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer ${
                    ta.is_aktif
                      ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                      : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                  }`}
                >
                  {ta.is_aktif ? "Aktif" : "Nonaktif"}
                </button>
              </div>

              <div className="space-y-2">
                {ta.semesters?.map((s) => (
                  <div key={s.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50/50">
                    <span className="text-sm text-slate-700">Semester {s.nama}</span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => toggleSemester(s, "is_aktif")}
                        className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer ${
                          s.is_aktif ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-500"
                        }`}
                      >
                        {s.is_aktif ? "Aktif" : "Nonaktif"}
                      </button>
                      <button
                        onClick={() => toggleSemester(s, "penilaian_dibuka")}
                        className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer ${
                          s.penilaian_dibuka ? "bg-blue-100 text-blue-700" : "bg-slate-200 text-slate-500"
                        }`}
                      >
                        {s.penilaian_dibuka ? "Penilaian Dibuka" : "Penilaian Ditutup"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
