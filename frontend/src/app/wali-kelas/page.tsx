"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

interface KelasRombel {
  id: number;
  nama: string;
}

interface Siswa {
  id: number;
  nis: string;
  nama: string;
}

export default function SiswaBinaanPage() {
  const { user } = useAuth();
  const [kelas, setKelas] = useState<KelasRombel[]>([]);
  const [siswas, setSiswas] = useState<Siswa[]>([]);

  useEffect(() => {
    if (!user) return;
    api.get<KelasRombel[]>("/kelas-rombel").then((res) => {
      setKelas(res.data);
    });
  }, [user]);

  useEffect(() => {
    if (kelas.length === 0) return;
    api.get("/siswa", { params: { kelas_rombel_id: kelas[0]?.id } }).then((res) => {
      setSiswas(res.data.data ?? res.data);
    });
  }, [kelas]);

  return (
    <div>
      <h1 className="text-lg font-semibold">Siswa Binaan</h1>
      <p className="mt-1 text-sm text-gray-500">
        Daftar siswa di kelas yang Anda walikan.
      </p>

      <table className="mt-6 w-full overflow-hidden rounded-xl border border-gray-200 bg-white text-sm">
        <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
          <tr>
            <th className="px-4 py-2">NIS</th>
            <th className="px-4 py-2">Nama</th>
          </tr>
        </thead>
        <tbody>
          {siswas.map((s) => (
            <tr key={s.id} className="border-t border-gray-100">
              <td className="px-4 py-2">{s.nis}</td>
              <td className="px-4 py-2">{s.nama}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
