"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

interface JadwalItem {
  id: number;
  hari: string;
  jam_mulai: string;
  jam_selesai: string;
  ruangan: string | null;
  guru_mapel_kelas: {
    mapel_plus: { nama: string };
    kelas_rombel: { nama: string };
  };
}

export default function JadwalGuruPage() {
  const [data, setData] = useState<JadwalItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<JadwalItem[]>("/jadwal").then((res) => {
      setData(res.data);
      setLoading(false);
    });
  }, []);

  return (
    <div>
      <h1 className="text-lg font-semibold">Jadwal Mengajar Saya</h1>

      {loading ? (
        <p className="mt-6 text-sm text-gray-500">Memuat...</p>
      ) : data.length === 0 ? (
        <p className="mt-6 text-sm text-gray-500">
          Belum ada jadwal. Minta admin untuk menetapkan Anda sebagai pengampu mapel di kelas tertentu.
        </p>
      ) : (
        <div className="mt-6 space-y-2">
          {data.map((j) => (
            <div key={j.id} className="rounded-xl border border-gray-200 bg-white p-4 text-sm">
              <p className="font-medium">
                {j.guru_mapel_kelas.mapel_plus.nama} · {j.guru_mapel_kelas.kelas_rombel.nama}
              </p>
              <p className="mt-1 text-gray-500">
                {j.hari}, {j.jam_mulai}–{j.jam_selesai}
                {j.ruangan ? ` · ${j.ruangan}` : ""}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
