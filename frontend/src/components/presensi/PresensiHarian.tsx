"use client";

import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import { fetchSemuaSiswa } from "@/lib/siswa";
import { labelKelas } from "@/lib/kelas";
import { useAuth } from "@/lib/auth-context";
import { PageHeader, Card, Button, Select, Skeleton, EmptyState, Alert } from "@/components/ui";

interface KelasInfo {
  id: number;
  nama: string;
}

interface SemesterLite {
  id: number;
  nama: string;
  is_aktif?: boolean;
}

interface JadwalItem {
  id: number;
  hari: string;
  jam_mulai?: string | null;
  jam_selesai?: string | null;
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

function labelJadwal(j: JadwalItem): string {
  const mapel = j.guru_mapel_kelas.mapel_plus.nama;
  const jam = j.jam_mulai && j.jam_selesai
    ? ` · ${j.jam_mulai.slice(0, 5)}–${j.jam_selesai.slice(0, 5)}`
    : "";
  return `${j.hari} · ${mapel}${jam}`;
}

/**
 * Presensi harian kelas untuk wali kelas.
 *
 * Satu tanggal = satu rekap kehadiran. Data tetap disimpan pada sesi jadwal
 * pertama kelas (kompatibel dengan struktur & rapor yang ada), tetapi UI
 * menyembunyikan detail sesi agar wali kelas tidak perlu memilih slot.
 */
export default function PresensiHarian() {
  const { user } = useAuth();
  const [kelasList, setKelasList] = useState<KelasInfo[]>([]);
  const [kelasId, setKelasId] = useState<number | null>(null);
  const [jadwal, setJadwal] = useState<JadwalItem | null>(null);
  const [tanggal, setTanggal] = useState(tanggalHariIni);
  const [siswas, setSiswas] = useState<Siswa[]>([]);
  const [status, setStatus] = useState<Record<number, Status>>({});
  const [loadingKelas, setLoadingKelas] = useState(true);
  const [memuatSiswa, setMemuatSiswa] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const bolehAkses = user?.role === "wali_kelas" || user?.role === "admin";

  // 1. Daftar kelas binaan (admin: semua kelas).
  useEffect(() => {
    if (!user || !bolehAkses) {
      setLoadingKelas(false);
      return;
    }
    let aktif = true;
    api.get<KelasInfo[]>("/kelas-rombel")
      .then((res) => {
        if (!aktif) return;
        const daftar = res.data.slice().sort((a, b) => a.nama.localeCompare(b.nama, "id-ID"));
        setKelasList(daftar);
        setKelasId(daftar[0]?.id ?? null);
      })
      .catch((err) => {
        if (aktif) setError(`Gagal memuat kelas: ${pesanError(err)}`);
      })
      .finally(() => {
        if (aktif) setLoadingKelas(false);
      });
    return () => { aktif = false; };
  }, [user, bolehAkses]);

  // 2. Sesi jadwal pertama kelas pada semester aktif menjadi "kanal" presensi.
  useEffect(() => {
    if (kelasId === null) {
      setJadwal(null);
      return;
    }
    let aktif = true;
    setJadwal(null);
    setSiswas([]);
    setStatus({});
    setSavedMsg(null);

    api.get<SemesterLite[]>("/semester")
      .then((res) => {
        const sem = res.data.find((s) => s.is_aktif) ?? res.data[0];
        return api.get<JadwalItem[]>("/jadwal", {
          params: {
            kelas_rombel_id: kelasId,
            ...(sem ? { semester_id: sem.id } : {}),
          },
        });
      })
      .then((res) => {
        if (aktif) setJadwal(res.data[0] ?? null);
      })
      .catch((err) => {
        if (aktif) setError(`Gagal memuat jadwal kelas: ${pesanError(err)}`);
      });
    return () => { aktif = false; };
  }, [kelasId]);

  // 3. Muat siswa + presensi tersimpan pada tanggal terpilih.
  useEffect(() => {
    if (kelasId === null || !jadwal) return;
    let aktif = true;
    setMemuatSiswa(true);
    setError(null);
    setSavedMsg(null);

    Promise.all([
      fetchSemuaSiswa<Siswa>({ kelas_rombel_id: kelasId }),
      api.get<PresensiItem[]>("/presensi", {
        params: { jadwal_id: jadwal.id, tanggal },
      }).then((res) => res.data).catch(() => [] as PresensiItem[]),
    ])
      .then(([daftarSiswa, tersimpan]) => {
        if (!aktif) return;
        const urut = daftarSiswa.slice().sort((a, b) => a.nama.localeCompare(b.nama, "id-ID"));
        setSiswas(urut);
        const isi: Record<number, Status> = {};
        for (const s of urut) isi[s.id] = "Hadir";
        for (const p of tersimpan) {
          if (!(p.siswa_id in isi)) continue;
          isi[p.siswa_id] = p.status;
        }
        setStatus(isi);
      })
      .catch((err) => {
        if (aktif) setError(`Gagal memuat data presensi: ${pesanError(err)}`);
      })
      .finally(() => {
        if (aktif) setMemuatSiswa(false);
      });
    return () => { aktif = false; };
  }, [kelasId, jadwal, tanggal]);

  const namaKelas = useMemo(
    () => kelasList.find((k) => k.id === kelasId)?.nama ?? "",
    [kelasList, kelasId]
  );

  const rekap = useMemo(() => {
    const hasil = { Hadir: 0, Sakit: 0, Izin: 0, Alpa: 0 };
    for (const s of siswas) hasil[status[s.id] ?? "Hadir"]++;
    return hasil;
  }, [siswas, status]);

  async function handleSimpan() {
    if (!jadwal || siswas.length === 0) return;
    setSaving(true);
    setError(null);
    setSavedMsg(null);
    try {
      await api.post("/presensi/massal", {
        jadwal_id: jadwal.id,
        tanggal,
        presensi: siswas.map((s) => ({
          siswa_id: s.id,
          status: status[s.id] ?? "Hadir",
        })),
      });
      setSavedMsg(`Presensi ${namaKelas} tanggal ${tanggal} tersimpan.`);
    } catch (err) {
      setError(`Gagal menyimpan presensi: ${pesanError(err)}`);
    } finally {
      setSaving(false);
    }
  }

  if (!bolehAkses) {
    return (
      <div className="animate-fade-in">
        <PageHeader title="Input Presensi" description="Presensi hanya dapat diinput oleh wali kelas." />
        <EmptyState
          title="Akses terbatas"
          description="Akun guru mapel tidak dapat menginput presensi. Hubungi wali kelas untuk pencatatan kehadiran."
        />
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Input Presensi"
        description="Presensi harian siswa kelas binaan. Cukup satu kali input per tanggal."
      />

      {error && (
        <div className="mb-6">
          <Alert variant="danger" onClose={() => setError(null)}>{error}</Alert>
        </div>
      )}

      <Card className="mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Select
            label="Kelas"
            value={kelasId ?? ""}
            onChange={(e) => setKelasId(Number(e.target.value) || null)}
            placeholder="Pilih kelas"
            disabled={loadingKelas || kelasList.length === 0}
          >
            {kelasList.map((k) => (
              <option key={k.id} value={k.id}>
                {labelKelas(k.nama) ?? k.nama}
              </option>
            ))}
          </Select>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Tanggal</label>
            <input
              type="date"
              value={tanggal}
              onChange={(e) => setTanggal(e.target.value)}
              onClick={(e) => { try { (e.currentTarget as HTMLInputElement & { showPicker?: () => void }).showPicker?.(); } catch { /* diabaikan */ } }}
              className="w-full px-4 py-2.5 text-sm glass-input"
            />
          </div>
        </div>
        {jadwal && (
          <p className="text-xs text-slate-400 mt-3">
            Disimpan sebagai presensi harian kelas · sesi: {labelJadwal(jadwal)}
          </p>
        )}
      </Card>

      {loadingKelas ? (
        <Skeleton className="h-40 w-full" />
      ) : kelasList.length === 0 ? (
        <EmptyState
          title="Belum ada kelas binaan"
          description="Anda belum ditetapkan sebagai wali kelas. Hubungi admin untuk penugasan kelas."
        />
      ) : !jadwal ? (
        <EmptyState
          title="Belum ada jadwal kelas"
          description="Kelas ini belum memiliki sesi jadwal pada semester aktif. Minta admin membuat jadwal terlebih dahulu."
        />
      ) : memuatSiswa ? (
        <Skeleton className="h-40 w-full" />
      ) : siswas.length === 0 ? (
        <EmptyState title="Belum ada siswa" description="Kelas ini belum memiliki siswa terdaftar." />
      ) : (
        <div className="space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {(["Hadir", "Sakit", "Izin", "Alpa"] as Status[]).map((st) => (
              <div key={st} className="rounded-xl border border-slate-200 bg-white px-3 py-2.5">
                <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wide">{st}</p>
                <p className="text-lg font-bold text-slate-800">{rekap[st]}</p>
              </div>
            ))}
          </div>

          <Card className="divide-y divide-slate-100">
            {siswas.map((s) => (
              <div key={s.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 py-3 first:pt-0 last:pb-0">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-full bg-emerald-500/10 text-emerald-700 flex items-center justify-center text-sm font-semibold shrink-0">
                    {s.nama.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{s.nama}</p>
                    <p className="text-xs text-slate-400 font-mono">NIS {s.nis}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {(["Hadir", "Sakit", "Izin", "Alpa"] as Status[]).map((st) => (
                    <button
                      key={st}
                      type="button"
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

          <div className="flex flex-wrap items-center gap-3">
            <Button onClick={handleSimpan} loading={saving}>Simpan Presensi</Button>
            {savedMsg && <p className="text-sm text-emerald-600 font-medium animate-fade-in">{savedMsg}</p>}
          </div>
        </div>
      )}
    </div>
  );
}
