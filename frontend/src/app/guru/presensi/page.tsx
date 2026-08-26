"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

interface JadwalItem {
  id: number;
  hari: string;
  guru_mapel_kelas: {
    mapel_plus: { nama: string };
    kelas_rombel: { id: number; nama: string };
  };
}

interface Siswa {
  id: number;
  nama: string;
  nis: string;
}

type Status = "Hadir" | "Sakit" | "Izin" | "Alpa";

export default function PresensiPage() {
  const [jadwals, setJadwals] = useState<JadwalItem[]>([]);
  const [jadwalId, setJadwalId] = useState<number | null>(null);
  const [tanggal, setTanggal] = useState(() => new Date().toISOString().slice(0, 10));
  const [siswas, setSiswas] = useState<Siswa[]>([]);
  const [status, setStatus] = useState<Record<number, Status>>({});
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);

  useEffect(() => {
    api.get<JadwalItem[]>("/jadwal").then((res) => setJadwals(res.data));
  }, []);

  useEffect(() => {
    const jadwal = jadwals.find((j) => j.id === jadwalId);
    if (!jadwal) {
      setSiswas([]);
      return;
    }
    api
      .get("/siswa", { params: { kelas_rombel_id: jadwal.guru_mapel_kelas.kelas_rombel.id } })
      .then((res) => {
        const list: Siswa[] = res.data.data ?? res.data;
        setSiswas(list);
        setStatus(Object.fromEntries(list.map((s) => [s.id, "Hadir" as Status])));
      });
  }, [jadwalId, jadwals]);

  async function handleSimpan() {
    if (!jadwalId) return;
    setSaving(true);
    setSavedMsg(null);
    await api.post("/presensi/massal", {
      jadwal_id: jadwalId,
      tanggal,
      presensi: siswas.map((s) => ({ siswa_id: s.id, status: status[s.id] ?? "Hadir" })),
    });
    setSaving(false);
    setSavedMsg("Presensi tersimpan.");
  }

  return (
    <div>
      <h1 className="text-lg font-semibold">Input Presensi</h1>

      <div className="mt-4 flex flex-wrap gap-2">
        <select
          value={jadwalId ?? ""}
          onChange={(e) => setJadwalId(Number(e.target.value) || null)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
        >
          <option value="">Pilih jadwal</option>
          {jadwals.map((j) => (
            <option key={j.id} value={j.id}>
              {j.hari} · {j.guru_mapel_kelas.mapel_plus.nama} · {j.guru_mapel_kelas.kelas_rombel.nama}
            </option>
          ))}
        </select>
        <input
          type="date"
          value={tanggal}
          onChange={(e) => setTanggal(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
      </div>

      {siswas.length > 0 && (
        <div className="mt-6 space-y-2">
          {siswas.map((s) => (
            <div key={s.id} className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm">
              <span>
                {s.nama} <span className="text-gray-400">({s.nis})</span>
              </span>
              <select
                value={status[s.id] ?? "Hadir"}
                onChange={(e) => setStatus({ ...status, [s.id]: e.target.value as Status })}
                className="rounded-lg border border-gray-300 px-2 py-1 text-sm"
              >
                <option value="Hadir">Hadir</option>
                <option value="Sakit">Sakit</option>
                <option value="Izin">Izin</option>
                <option value="Alpa">Alpa</option>
              </select>
            </div>
          ))}

          <button
            onClick={handleSimpan}
            disabled={saving}
            className="mt-4 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            {saving ? "Menyimpan..." : "Simpan Presensi"}
          </button>
          {savedMsg && <p className="mt-2 text-sm text-emerald-600">{savedMsg}</p>}
        </div>
      )}
    </div>
  );
}
