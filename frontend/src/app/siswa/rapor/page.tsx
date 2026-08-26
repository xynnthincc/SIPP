"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

interface Rapor {
  id: number;
  status: string;
  siswa: { id: number };
  semester: { id: number; nama: string };
}

interface RekapItem {
  mapel: string;
  nilai_akhir: number | null;
}

const STATUS_COLOR: Record<string, string> = {
  Draft: "bg-gray-100 text-gray-600",
  Diajukan: "bg-amber-100 text-amber-700",
  Divalidasi: "bg-blue-100 text-blue-700",
  Ditolak: "bg-red-100 text-red-700",
  Diterbitkan: "bg-emerald-100 text-emerald-700",
};

export default function RaporSiswaPage() {
  const [rapors, setRapors] = useState<Rapor[]>([]);
  const [rekap, setRekap] = useState<Record<number, RekapItem[]>>({});

  useEffect(() => {
    api.get<Rapor[]>("/rapors").then(async (res) => {
      setRapors(res.data);
      // Rekap nilai hanya relevan untuk rapor yang sudah diterbitkan
      for (const r of res.data.filter((r) => r.status === "Diterbitkan")) {
        const rk = await api.get<RekapItem[]>(`/siswas/${r.siswa.id}/nilai-rekap/${r.semester.id}`);
        setRekap((prev) => ({ ...prev, [r.id]: rk.data }));
      }
    });
  }, []);

  return (
    <div>
      <h1 className="text-lg font-semibold">Rapor Saya</h1>

      <div className="mt-6 space-y-4">
        {rapors.length === 0 && <p className="text-sm text-gray-500">Belum ada rapor.</p>}
        {rapors.map((r) => (
          <div key={r.id} className="rounded-xl border border-gray-200 bg-white p-4 text-sm">
            <div className="flex items-center justify-between">
              <p className="font-medium">Semester {r.semester.nama}</p>
              <span className={`rounded-full px-2 py-0.5 text-xs ${STATUS_COLOR[r.status]}`}>{r.status}</span>
            </div>

            {rekap[r.id] && (
              <table className="mt-3 w-full text-sm">
                <tbody>
                  {rekap[r.id].map((item, i) => (
                    <tr key={i} className="border-t border-gray-100">
                      <td className="py-1.5">{item.mapel}</td>
                      <td className="py-1.5 text-right font-medium">{item.nilai_akhir ?? "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
