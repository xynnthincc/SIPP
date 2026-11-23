"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { fetchSemuaSiswa } from "@/lib/siswa";
import { labelKelas } from "@/lib/kelas";
import { PageHeader, Card, Button, Select, Skeleton, EmptyState, Alert } from "@/components/ui";

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

interface PresensiItem {
  siswa_id: number;
  status: Status;
  keterangan?: string | null;
}

type Status = "Hadir" | "Sakit" | "Izin" | "Alpa";

// Hindari toISOString(): UTC bisa mundur 1 hari antara 00:00–06:59 WIB.
function tanggalHariIni(): string {
  const d = new Date();
  const bulan = String(d.getMonth() + 1).padStart(2, "0");
  const hari = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${bulan}-${hari}`;
}

function pesanError(err: unknown): string {
  if (typeof err === "object" && err !== null) {
    const e = err as { response?: { data?: { message?: string } }; message?: string };
    return e.response?.data?.message ?? e.message ?? "Terjadi kesalahan.";
  }
  return "Terjadi kesalahan.";
}

export default function PresensiPage() {
  const [jadwals, setJadwals] = useState<JadwalItem[]>([]);
  const [jadwalId, setJadwalId] = useState<number | null>(null);
  const [tanggal, setTanggal] = useState(tanggalHariIni);
  const [siswas, setSiswas] = useState<Siswa[]>([]);
  const [status, setStatus] = useState<Record<number, Status>>({});
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingJadwal, setLoadingJadwal] = useState(true);

  useEffect(() => {
    let aktif = true;
    api.get<JadwalItem[]>("/jadwal")
      .then((res) => {
        if (aktif) setJadwals(res.data);
      })
      .catch((err) => {
        if (aktif) setError(`Gagal memuat jadwal: ${pesanError(err)}`);
      })
      .finally(() => {
        if (aktif) setLoadingJadwal(false);
      });
    return () => { aktif = false; };
  }, []);

  // Prefill: data tersimpan lebih dulu, baru default Hadir untuk yang belum ada.
  // Efek dijalankan ulang saat tanggal berubah agar edit tidak menimpa data lama.
  useEffect(() => {
    if (!jadwalId) return;
    const jadwal = jadwals.find((j) => j.id === jadwalId);
    if (!jadwal) return;

    let aktif = true;
    setError(null);
    fetchSemuaSiswa<Siswa>({ kelas_rombel_id: jadwal.guru_mapel_kelas.kelas_rombel.id })
      .then(async (list) => {
        let tersimpan: PresensiItem[] = [];
        try {
          const res = await api.get<PresensiItem[]>("/presensi", {
            params: { jadwal_id: jadwalId, tanggal },
          });
          tersimpan = res.data;
        } catch {
          tersimpan = [];
          if (aktif) {
            setError("Presensi tersimpan gagal dimuat; status diisi default Hadir. Periksa sebelum menyimpan.");
          }
        }

        if (!aktif) return;
        const awal = Object.fromEntries(list.map((s) => [s.id, "Hadir" as Status]));
        tersimpan.forEach((p) => {
          if (p.siswa_id in awal && (["Hadir", "Sakit", "Izin", "Alpa"] as string[]).includes(p.status)) {
            awal[p.siswa_id] = p.status;
          }
        });
        setSiswas(list);
        setStatus(awal);
      })
      .catch((err) => {
        if (aktif) setError(`Gagal memuat siswa: ${pesanError(err)}`);
      });
    return () => { aktif = false; };
  }, [jadwalId, jadwals, tanggal]);

  async function handleSimpan() {
    if (!jadwalId) return;
    setSaving(true);
    setError(null);
    setSavedMsg(null);
    try {
      await api.post("/presensi/massal", {
        jadwal_id: jadwalId,
        tanggal,
        presensi: siswas.map((s) => ({ siswa_id: s.id, status: status[s.id] ?? "Hadir" })),
      });
      setSavedMsg("Presensi berhasil disimpan.");
    } catch (err) {
      setError(`Gagal menyimpan presensi: ${pesanError(err)}`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="animate-fade-in">
      <PageHeader title="Input Presensi" description="Rekap kehadiran siswa per sesi mengajar." />

      {error && (
        <div className="mb-6">
          <Alert variant="danger" onClose={() => setError(null)}>{error}</Alert>
        </div>
      )}

      <Card className="mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <Select
              label="Jadwal"
              value={jadwalId ?? ""}
              onChange={(e) => {
                const v = Number(e.target.value) || null;
                setJadwalId(v);
                setSavedMsg(null);
                if (!v) setSiswas([]);
              }}
              placeholder="Pilih jadwal mengajar"
            >
              {jadwals.map((j) => (
                <option key={j.id} value={j.id}>
                  {`${j.hari} · ${j.guru_mapel_kelas.mapel_plus.nama} · ${labelKelas(j.guru_mapel_kelas.kelas_rombel.nama) ?? j.guru_mapel_kelas.kelas_rombel.nama}`}
                </option>
              ))}
            </Select>
          </div>
          <div className="w-full sm:w-48">
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Tanggal</label>
            <input
              type="date"
              value={tanggal}
              onChange={(e) => { setTanggal(e.target.value); setSavedMsg(null); }}
              onClick={(e) => { try { (e.currentTarget as HTMLInputElement & { showPicker?: () => void }).showPicker?.(); } catch { /* diabaikan */ } }}
              className="w-full px-4 py-2.5 text-sm glass-input"
            />
          </div>
        </div>
      </Card>

      {loadingJadwal ? (
        <Skeleton className="h-40 w-full" />
      ) : siswas.length > 0 ? (
        <div className="space-y-3">
          <Card className="divide-y divide-slate-100">
            {siswas.map((s) => (
              <div key={s.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-full bg-emerald-500/10 text-emerald-700 flex items-center justify-center text-sm font-semibold shrink-0">
                    {s.nama.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{s.nama}</p>
                    <p className="text-xs text-slate-400 font-mono">NIS {s.nis}</p>
                  </div>
                </div>
                <div className="flex gap-1.5">
                  {(["Hadir", "Sakit", "Izin", "Alpa"] as Status[]).map((st) => (
                    <button
                      key={st}
                      onClick={() => { setSavedMsg(null); setStatus({ ...status, [s.id]: st }); }}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                        status[s.id] === st
                          ? st === "Hadir" ? "bg-emerald-500 text-white shadow" :
                            st === "Sakit" ? "bg-amber-500 text-white shadow" :
                            st === "Izin" ? "bg-blue-500 text-white shadow" :
                            "bg-red-500 text-white shadow"
                          : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </Card>

          <div className="flex items-center gap-3">
            <Button onClick={handleSimpan} loading={saving}>Simpan Presensi</Button>
            {savedMsg && <p className="text-sm text-emerald-600 font-medium animate-fade-in">{savedMsg}</p>}
          </div>
        </div>
      ) : jadwalId ? (
        <EmptyState title="Tidak ada siswa" description="Kelas ini belum memiliki siswa terdaftar." />
      ) : null}
    </div>
  );
}
