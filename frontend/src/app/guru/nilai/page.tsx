"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

interface JadwalItem {
  id: number;
  guru_mapel_kelas: {
    mapel_plus: { id: number; nama: string };
    kelas_rombel: { id: number; nama: string };
    semester_id: number;
  };
}

interface JenisAssessment {
  id: number;
  nama: string;
  bobot: number;
}

interface Siswa {
  id: number;
  nama: string;
  nis: string;
}

export default function NilaiGuruPage() {
  const [jadwals, setJadwals] = useState<JadwalItem[]>([]);
  const [jadwalId, setJadwalId] = useState<number | null>(null);
  const [jenisList, setJenisList] = useState<JenisAssessment[]>([]);
  const [jenisId, setJenisId] = useState<number | null>(null);
  const [siswas, setSiswas] = useState<Siswa[]>([]);
  const [nilai, setNilai] = useState<Record<number, string>>({});
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);

  const jadwal = jadwals.find((j) => j.id === jadwalId) ?? null;

  useEffect(() => {
    api.get<JadwalItem[]>("/jadwal").then((res) => setJadwals(res.data));
  }, []);

  useEffect(() => {
    if (!jadwal) return;
    api
      .get<JenisAssessment[]>("/jenis-assessment", {
        params: { mapel_plus_id: jadwal.guru_mapel_kelas.mapel_plus.id },
      })
      .then((res) => setJenisList(res.data));
    api
      .get("/siswa", { params: { kelas_rombel_id: jadwal.guru_mapel_kelas.kelas_rombel.id } })
      .then((res) => {
        const list: Siswa[] = res.data.data ?? res.data;
        setSiswas(list);
      });
  }, [jadwal]);

  async function handleSimpan() {
    if (!jadwal || !jenisId) return;
    setSaving(true);
    setSavedMsg(null);
    await api.post("/nilai/massal", {
      jenis_assessment_id: jenisId,
      semester_id: jadwal.guru_mapel_kelas.semester_id,
      nilai: siswas
        .filter((s) => nilai[s.id] !== undefined && nilai[s.id] !== "")
        .map((s) => ({ siswa_id: s.id, nilai: Number(nilai[s.id]) })),
    });
    setSaving(false);
    setSavedMsg("Nilai tersimpan.");
  }

  return (
    <div>
      <h1 className="text-lg font-semibold">Input Nilai</h1>

      <div className="mt-4 flex flex-wrap gap-2">
        <select
          value={jadwalId ?? ""}
          onChange={(e) => setJadwalId(Number(e.target.value) || null)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
        >
          <option value="">Pilih kelas & mapel</option>
          {jadwals.map((j) => (
            <option key={j.id} value={j.id}>
              {j.guru_mapel_kelas.mapel_plus.nama} · {j.guru_mapel_kelas.kelas_rombel.nama}
            </option>
          ))}
        </select>

        {jadwal && (
          <select
            value={jenisId ?? ""}
            onChange={(e) => setJenisId(Number(e.target.value) || null)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="">Pilih jenis assessment</option>
            {jenisList.map((j) => (
              <option key={j.id} value={j.id}>
                {j.nama} (bobot {j.bobot}%)
              </option>
            ))}
          </select>
        )}
      </div>

      {jenisId && siswas.length > 0 && (
        <div className="mt-6 space-y-2">
          {siswas.map((s) => (
            <div key={s.id} className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm">
              <span>
                {s.nama} <span className="text-gray-400">({s.nis})</span>
              </span>
              <input
                type="number"
                min={0}
                max={100}
                value={nilai[s.id] ?? ""}
                onChange={(e) => setNilai({ ...nilai, [s.id]: e.target.value })}
                className="w-20 rounded-lg border border-gray-300 px-2 py-1 text-sm"
              />
            </div>
          ))}

          <button
            onClick={handleSimpan}
            disabled={saving}
            className="mt-4 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            {saving ? "Menyimpan..." : "Simpan Nilai"}
          </button>
          {savedMsg && <p className="mt-2 text-sm text-emerald-600">{savedMsg}</p>}
        </div>
      )}
    </div>
  );
}
