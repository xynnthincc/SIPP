"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

interface Siswa {
  id: number;
  nis: string;
  nama: string;
}

interface Semester {
  id: number;
  nama: string;
  is_aktif: boolean;
}

interface Rapor {
  id: number;
  status: string;
  siswa: { id: number; nama: string };
}

const STATUS_COLOR: Record<string, string> = {
  Draft: "bg-gray-100 text-gray-600",
  Diajukan: "bg-amber-100 text-amber-700",
  Divalidasi: "bg-blue-100 text-blue-700",
  Ditolak: "bg-red-100 text-red-700",
  Diterbitkan: "bg-emerald-100 text-emerald-700",
};

export default function RaporWaliKelasPage() {
  const [siswas, setSiswas] = useState<Siswa[]>([]);
  const [semesterAktif, setSemesterAktif] = useState<Semester | null>(null);
  const [rapors, setRapors] = useState<Rapor[]>([]);

  async function load() {
    const kelasRes = await api.get("/kelas-rombel");
    const kelasId = kelasRes.data[0]?.id;
    if (kelasId) {
      const siswaRes = await api.get("/siswa", { params: { kelas_rombel_id: kelasId } });
      setSiswas(siswaRes.data.data ?? siswaRes.data);
    }

    const taRes = await api.get("/tahun-ajaran");
    const aktif = taRes.data.find((t: any) => t.is_aktif);
    const semAktif = aktif?.semesters?.find((s: Semester) => s.is_aktif) ?? null;
    setSemesterAktif(semAktif);

    if (semAktif) {
      const raporRes = await api.get<Rapor[]>("/rapors", { params: { semester_id: semAktif.id } });
      setRapors(raporRes.data);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function raporUntuk(siswaId: number) {
    return rapors.find((r) => r.siswa.id === siswaId);
  }

  async function susunDraft(siswaId: number) {
    if (!semesterAktif) return;
    await api.post("/rapors", { siswa_id: siswaId, semester_id: semesterAktif.id });
    load();
  }

  async function ajukan(raporId: number) {
    await api.post(`/rapors/${raporId}/ajukan`);
    load();
  }

  return (
    <div>
      <h1 className="text-lg font-semibold">Rapor Pesantren — Semester {semesterAktif?.nama ?? "-"}</h1>

      <table className="mt-6 w-full overflow-hidden rounded-xl border border-gray-200 bg-white text-sm">
        <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
          <tr>
            <th className="px-4 py-2">NIS</th>
            <th className="px-4 py-2">Nama</th>
            <th className="px-4 py-2">Status</th>
            <th className="px-4 py-2">Aksi</th>
          </tr>
        </thead>
        <tbody>
          {siswas.map((s) => {
            const rapor = raporUntuk(s.id);
            return (
              <tr key={s.id} className="border-t border-gray-100">
                <td className="px-4 py-2">{s.nis}</td>
                <td className="px-4 py-2">{s.nama}</td>
                <td className="px-4 py-2">
                  <span className={`rounded-full px-2 py-0.5 text-xs ${STATUS_COLOR[rapor?.status ?? "Draft"]}`}>
                    {rapor?.status ?? "Belum disusun"}
                  </span>
                </td>
                <td className="px-4 py-2">
                  {!rapor && (
                    <button
                      onClick={() => susunDraft(s.id)}
                      className="text-xs font-medium text-emerald-600 hover:underline"
                    >
                      Susun Draft
                    </button>
                  )}
                  {rapor?.status === "Draft" && (
                    <button
                      onClick={() => ajukan(rapor.id)}
                      className="text-xs font-medium text-emerald-600 hover:underline"
                    >
                      Ajukan ke Kepala Sekolah
                    </button>
                  )}
                  {rapor?.status === "Ditolak" && (
                    <span className="text-xs text-gray-400">Perbaiki lalu ajukan ulang manual (lihat SETUP.md)</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
