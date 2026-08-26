"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

interface Anak {
  id: number;
  nis: string;
  nama: string;
  kelas_rombel: { nama: string } | null;
}

interface ProgresHafalan {
  id: number;
  tanggal_setoran: string;
  materi: string;
  status: string;
  mapel_plus: { nama: string };
}

interface CatatanGuru {
  id: number;
  tanggal: string;
  catatan: string;
}

interface Presensi {
  id: number;
  tanggal: string;
  status: string;
}

export default function ProgresAnakPage() {
  const [anakList, setAnakList] = useState<Anak[]>([]);
  const [anakId, setAnakId] = useState<number | null>(null);
  const [progres, setProgres] = useState<ProgresHafalan[]>([]);
  const [catatan, setCatatan] = useState<CatatanGuru[]>([]);
  const [presensi, setPresensi] = useState<Presensi[]>([]);

  useEffect(() => {
    api.get<Anak[]>("/siswa").then((res) => {
      setAnakList(res.data);
      if (res.data.length > 0) setAnakId(res.data[0].id);
    });
  }, []);

  useEffect(() => {
    if (!anakId) return;
    api.get<ProgresHafalan[]>("/progres-hafalan", { params: { siswa_id: anakId } }).then((res) => setProgres(res.data));
    api.get<CatatanGuru[]>("/catatan-guru", { params: { siswa_id: anakId } }).then((res) => setCatatan(res.data));
    api.get<Presensi[]>("/presensi", { params: { siswa_id: anakId } }).then((res) => setPresensi(res.data));
  }, [anakId]);

  return (
    <div>
      <h1 className="text-lg font-semibold">Progres Anak</h1>

      {anakList.length > 1 && (
        <select
          value={anakId ?? ""}
          onChange={(e) => setAnakId(Number(e.target.value))}
          className="mt-4 rounded-lg border border-gray-300 px-3 py-2 text-sm"
        >
          {anakList.map((a) => (
            <option key={a.id} value={a.id}>
              {a.nama}
            </option>
          ))}
        </select>
      )}

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <section>
          <h2 className="text-sm font-semibold text-gray-700">Progres Hafalan Terbaru</h2>
          <div className="mt-2 space-y-2">
            {progres.length === 0 && <p className="text-sm text-gray-400">Belum ada catatan.</p>}
            {progres.map((p) => (
              <div key={p.id} className="rounded-lg border border-gray-200 bg-white p-3 text-sm">
                <p className="font-medium">{p.mapel_plus.nama} · {p.materi}</p>
                <p className="text-xs text-gray-500">{p.tanggal_setoran} · {p.status}</p>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-sm font-semibold text-gray-700">Catatan Guru</h2>
          <div className="mt-2 space-y-2">
            {catatan.length === 0 && <p className="text-sm text-gray-400">Belum ada catatan.</p>}
            {catatan.map((c) => (
              <div key={c.id} className="rounded-lg border border-gray-200 bg-white p-3 text-sm">
                <p>{c.catatan}</p>
                <p className="text-xs text-gray-500">{c.tanggal}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="md:col-span-2">
          <h2 className="text-sm font-semibold text-gray-700">Presensi Terbaru</h2>
          <div className="mt-2 flex flex-wrap gap-2">
            {presensi.length === 0 && <p className="text-sm text-gray-400">Belum ada data.</p>}
            {presensi.slice(0, 20).map((p) => (
              <span
                key={p.id}
                className={`rounded-full px-3 py-1 text-xs ${
                  p.status === "Hadir"
                    ? "bg-emerald-100 text-emerald-700"
                    : p.status === "Alpa"
                    ? "bg-red-100 text-red-700"
                    : "bg-amber-100 text-amber-700"
                }`}
              >
                {p.tanggal} · {p.status}
              </span>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
