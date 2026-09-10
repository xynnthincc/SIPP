"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { PageHeader, Card, Button, Input, Select, Skeleton, EmptyState } from "@/components/ui";

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
  const [loadingJadwal, setLoadingJadwal] = useState(true);

  const jadwal = jadwals.find((j) => j.id === jadwalId) ?? null;

  useEffect(() => {
    api.get<JadwalItem[]>("/jadwal").then((res) => {
      setJadwals(res.data);
      setLoadingJadwal(false);
    });
  }, []);

  useEffect(() => {
    if (!jadwal) return;
    api.get<JenisAssessment[]>("/jenis-assessment", { params: { mapel_plus_id: jadwal.guru_mapel_kelas.mapel_plus.id } }).then((res) => setJenisList(res.data));
    api.get("/siswa", { params: { kelas_rombel_id: jadwal.guru_mapel_kelas.kelas_rombel.id } }).then((res) => setSiswas(res.data.data ?? res.data));
  }, [jadwal]);

  async function handleSimpan() {
    if (!jadwal || !jenisId) return;
    setSaving(true);
    setSavedMsg(null);
    await api.post("/nilai/massal", {
      jenis_assessment_id: jenisId,
      semester_id: jadwal.guru_mapel_kelas.semester_id,
      nilai: siswas.filter((s) => nilai[s.id] !== undefined && nilai[s.id] !== "").map((s) => ({ siswa_id: s.id, nilai: Number(nilai[s.id]) })),
    });
    setSaving(false);
    setSavedMsg("Nilai berhasil disimpan.");
  }

  return (
    <div className="animate-fade-in">
      <PageHeader title="Input Nilai" description="Input nilai massal per siswa berdasarkan jenis assessment." />

      <Card className="mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <Select label="Kelas & Mapel" value={jadwalId ?? ""} onChange={(e) => { setJadwalId(Number(e.target.value) || null); setJenisId(null); }} placeholder="Pilih kelas & mapel">
              {jadwals.map((j) => (
                <option key={j.id} value={j.id}>{j.guru_mapel_kelas.mapel_plus.nama} - {j.guru_mapel_kelas.kelas_rombel.nama}</option>
              ))}
            </Select>
          </div>
          {jadwal && (
            <div className="flex-1">
              <Select label="Jenis Assessment" value={jenisId ?? ""} onChange={(e) => setJenisId(Number(e.target.value) || null)} placeholder="Pilih jenis assessment">
                {jenisList.map((j) => (
                  <option key={j.id} value={j.id}>{j.nama} (bobot {j.bobot}%)</option>
                ))}
              </Select>
            </div>
          )}
        </div>
      </Card>

      {loadingJadwal ? (
        <Skeleton className="h-40 w-full" />
      ) : jenisId && siswas.length > 0 ? (
        <div className="space-y-3">
          <Card className="divide-y divide-slate-100">
            {siswas.map((s) => (
              <div key={s.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                <div>
                  <p className="text-sm font-medium text-slate-800">{s.nama}</p>
                  <p className="text-xs text-slate-400 font-mono">{s.nis}</p>
                </div>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={nilai[s.id] ?? ""}
                  onChange={(e) => setNilai({ ...nilai, [s.id]: e.target.value })}
                  className="w-20 px-3 py-1.5 text-sm text-center glass-input rounded-lg"
                  placeholder="0-100"
                />
              </div>
            ))}
          </Card>

          <div className="flex items-center gap-3">
            <Button onClick={handleSimpan} loading={saving}>Simpan Nilai</Button>
            {savedMsg && <p className="text-sm text-emerald-600 font-medium animate-fade-in">{savedMsg}</p>}
          </div>
        </div>
      ) : jadwalId ? (
        <EmptyState title="Pilih jenis assessment" description="Pilih jenis assessment terlebih dahulu untuk mulai menginput nilai." />
      ) : null}
    </div>
  );
}
