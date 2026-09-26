"use client";

import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import { labelKelas } from "@/lib/kelas";
import { labelSemester } from "@/lib/semester";
import { PageHeader, Card, Button, Select, Skeleton, EmptyState, Alert } from "@/components/ui";

type Mode = "asesmen" | "langsung";

interface SemesterLite {
  id: number;
  nama: string;
  jenis: "Akhir" | "Sementara";
  is_aktif: boolean;
  tahun_ajaran: { nama: string } | null;
}

interface Pengampuan {
  id: number;
  semester_id: number;
  mapel_plus: { id: number; nama: string };
  kelas_rombel: { id: number; nama: string };
}

interface JadwalItem {
  id: number;
  guru_mapel_kelas: Pengampuan;
}

interface JenisAssessment {
  id: number;
  nama: string;
  kategori: "formatif" | "sumatif";
  bobot: number;
}

interface Siswa {
  id: number;
  nama: string;
  nis: string;
}

interface MassalRow {
  siswa_id: number;
  nama: string;
  nis: string;
  nilai: number | null;
  kkm: number | null;
}

export default function NilaiGuruPage() {
  const [mode, setMode] = useState<Mode>("asesmen");
  const [semesters, setSemesters] = useState<SemesterLite[]>([]);
  const [semesterId, setSemesterId] = useState("");
  const [jadwals, setJadwals] = useState<JadwalItem[]>([]);
  const [pengampuanId, setPengampuanId] = useState<number | null>(null);
  const [jenisList, setJenisList] = useState<JenisAssessment[]>([]);
  const [jenisId, setJenisId] = useState<number | null>(null);
  const [siswaList, setSiswaList] = useState<Siswa[]>([]);
  const [prefill, setPrefill] = useState<Record<number, number | null>>({});
  const [nilai, setNilai] = useState<Record<number, string>>({});
  const [dataKey, setDataKey] = useState<string | null>(null);
  const [loadingJadwal, setLoadingJadwal] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      api.get<SemesterLite[]>("/semester"),
      // Penugasan pengampuan langsung (bukan turunan jadwal): guru bisa mengampu
      // banyak mapel & kelas — tanpa harus punya slot jadwal per mapel
      api.get<Pengampuan[]>("/pengampuan-saya"),
    ]).then(([sem, peng]) => {
      setSemesters(sem.data);
      const aktif = sem.data.find((s) => s.is_aktif) ?? sem.data[0];
      if (aktif) setSemesterId(String(aktif.id));
      setJadwals(peng.data.map((p) => ({ id: p.id, guru_mapel_kelas: p })));
      setLoadingJadwal(false);
    }).catch(() => {
      setError("Gagal memuat data semester/penugasan.");
      setLoadingJadwal(false);
    });
  }, []);

  // Satu guru bisa punya beberapa slot jadwal untuk mapel+kelas yang sama —
  // dedupe berdasarkan pengampuan (guru_mapel_kelas) supaya pilihan tidak ganda
  const pengampuanList = useMemo(() => {
    const map = new Map<number, Pengampuan>();
    jadwals.forEach((j) => map.set(j.guru_mapel_kelas.id, j.guru_mapel_kelas));
    return [...map.values()];
  }, [jadwals]);

  const pengampuanTersaring = useMemo(
    () => (semesterId ? pengampuanList.filter((p) => String(p.semester_id) === semesterId) : []),
    [pengampuanList, semesterId]
  );

  const pengampuan = pengampuanTersaring.find((p) => p.id === pengampuanId) ?? null;

  // Data per pengampuan+mode dimuat dalam satu efek; state "dataKey" menandai
  // kombinasi terakhir yang berhasil dimuat (semua setState di .then → async)
  useEffect(() => {
    if (!pengampuan) return;
    let aktif = true;
    const kunci = `${pengampuan.id}:${mode}`;

    if (mode === "asesmen") {
      Promise.all([
        api.get<JenisAssessment[]>("/jenis-assessment", {
          params: { mapel_plus_id: pengampuan.mapel_plus.id },
        }),
        api.get("/siswa", { params: { kelas_rombel_id: pengampuan.kelas_rombel.id } }),
      ]).then(([ja, sw]) => {
        if (!aktif) return;
        setJenisList(ja.data);
        setSiswaList(sw.data.data ?? sw.data);
        setPrefill({});
        setDataKey(kunci);
      }).catch(() => {
        if (!aktif) return;
        setJenisList([]);
        setSiswaList([]);
        setPrefill({});
        setDataKey(kunci);
      });
    } else {
      api.get<MassalRow[]>("/nilai-diniyah/massal", {
        params: {
          mapel_plus_id: pengampuan.mapel_plus.id,
          kelas_rombel_id: pengampuan.kelas_rombel.id,
          semester_id: pengampuan.semester_id,
        },
      }).then((res) => {
        if (!aktif) return;
        setSiswaList(res.data.map((r) => ({ id: r.siswa_id, nama: r.nama, nis: r.nis })));
        const pf: Record<number, number | null> = {};
        const input: Record<number, string> = {};
        res.data.forEach((r) => {
          pf[r.siswa_id] = r.nilai;
          input[r.siswa_id] = r.nilai !== null ? String(r.nilai) : "";
        });
        setPrefill(pf);
        setNilai(input);
        setDataKey(kunci);
      }).catch(() => {
        if (!aktif) return;
        setSiswaList([]);
        setPrefill({});
        setDataKey(kunci);
      });
    }

    return () => { aktif = false; };
  }, [pengampuan, mode]);

  const dataSiap = pengampuan !== null && dataKey === `${pengampuan.id}:${mode}`;

  function pilihSemester(v: string) {
    setSemesterId(v);
    setPengampuanId(null);
    setJenisId(null);
    setNilai({});
    setSavedMsg(null);
  }

  function pilihPengampuan(v: string) {
    setPengampuanId(Number(v) || null);
    setJenisId(null);
    setNilai({});
    setSavedMsg(null);
  }

  function gantiMode(m: Mode) {
    if (m === mode) return;
    setMode(m);
    setJenisId(null);
    setNilai({});
    setSavedMsg(null);
  }

  async function handleSimpan() {
    if (!pengampuan || !semesterId) return;
    if (mode === "asesmen" && !jenisId) return;
    if (mode === "langsung" && !dataSiap) return;

    setSaving(true);
    setSavedMsg(null);
    setError(null);
    try {
      if (mode === "asesmen") {
        await api.post("/nilai/massal", {
          jenis_assessment_id: jenisId,
          semester_id: Number(semesterId),
          nilai: siswaList
            .filter((s) => nilai[s.id] !== undefined && nilai[s.id] !== "")
            .map((s) => ({ siswa_id: s.id, nilai: Number(nilai[s.id]) })),
        });
      } else {
        await api.post("/nilai-diniyah/massal", {
          mapel_plus_id: pengampuan.mapel_plus.id,
          kelas_rombel_id: pengampuan.kelas_rombel.id,
          semester_id: Number(semesterId),
          nilai: siswaList
            .filter((s) => (nilai[s.id] ?? "") !== "" || prefill[s.id] != null)
            .map((s) => ({
              siswa_id: s.id,
              nilai: (nilai[s.id] ?? "") === "" ? null : Number(nilai[s.id]),
            })),
        });
      }
      setSavedMsg("Nilai berhasil disimpan.");
    } catch (err: unknown) {
      const pesan = (err as { response?: { data?: { message?: string } } })?.response?.data;
      setError(pesan?.message ?? "Gagal menyimpan nilai.");
    } finally {
      setSaving(false);
    }
  }

  const tampilList =
    mode === "asesmen"
      ? dataSiap && jenisId !== null
      : dataSiap;

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Input Nilai"
        description={mode === "asesmen"
          ? "Input nilai per jenis asesmen — dihitung otomatis dengan bobot menjadi nilai akhir."
          : "Input nilai akhir langsung untuk rapor — tanpa perlu asesmen."}
      />

      {error && (
        <div className="mb-6">
          <Alert variant="danger" onClose={() => setError(null)}>{error}</Alert>
        </div>
      )}

      {/* Toggle mode */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div className="flex gap-1 p-1 bg-slate-100 rounded-xl w-fit">
          <button
            type="button"
            onClick={() => gantiMode("asesmen")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
              mode === "asesmen"
                ? "bg-white text-emerald-800 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            Per Asesmen
          </button>
          <button
            type="button"
            onClick={() => gantiMode("langsung")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
              mode === "langsung"
                ? "bg-white text-emerald-800 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            Nilai Akhir Langsung
          </button>
        </div>
        <p className="text-xs text-slate-400 max-w-md">
          {mode === "asesmen"
            ? "Nilai akhir mapel = rata-rata tertimbang bobot asesmen sumatif. Opsional — bisa juga pakai mode Nilai Akhir Langsung."
            : "Nilai langsung dipakai rapor apa adanya dan menimpa hasil perhitungan asesmen. Kosongkan kotak (yang tadinya terisi) untuk kembali memakai hasil perhitungan asesmen."}
        </p>
      </div>

      <Card className="mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Select
            label="Semester"
            value={semesterId}
            onChange={(e) => pilihSemester(e.target.value)}
            placeholder="Pilih semester"
            disabled={semesters.length === 0}
          >
            {semesters.map((s) => (
              <option key={s.id} value={s.id}>
                  {labelSemester(s)}
              </option>
            ))}
          </Select>
          <Select
            label="Mapel & Kelas"
            value={pengampuanId ?? ""}
            onChange={(e) => pilihPengampuan(e.target.value)}
            placeholder="Pilih mapel & kelas"
            disabled={!semesterId || pengampuanTersaring.length === 0}
          >
            {pengampuanTersaring.map((p) => (
              <option key={p.id} value={p.id}>
                {`${p.mapel_plus.nama} · ${labelKelas(p.kelas_rombel.nama) ?? p.kelas_rombel.nama}`}
              </option>
            ))}
          </Select>
          {mode === "asesmen" && (
            <Select
              label="Jenis Asesmen"
              value={jenisId ?? ""}
              onChange={(e) => { setJenisId(Number(e.target.value) || null); setSavedMsg(null); }}
              placeholder={dataSiap ? "Pilih jenis asesmen" : "Memuat…"}
              disabled={!pengampuan || !dataSiap || jenisList.length === 0}
            >
              {jenisList.map((j) => (
                <option key={j.id} value={j.id}>
                  {j.nama} {j.kategori === "sumatif" ? `(Sumatif · bobot ${Math.round(j.bobot)}%)` : "(Formatif · tidak dihitung)"}
                </option>
              ))}
            </Select>
          )}
        </div>
      </Card>

      {loadingJadwal ? (
        <Skeleton className="h-40 w-full" />
      ) : !semesterId ? (
        <EmptyState title="Pilih semester" description="Pilih semester mengajar untuk melihat daftar mapel & kelas." />
      ) : pengampuanTersaring.length === 0 ? (
        <EmptyState title="Tidak ada mapel di semester ini" description="Anda belum memiliki penugasan mengajar pada semester terpilih." />
      ) : !pengampuan ? (
        <EmptyState title="Pilih mapel & kelas" description="Pilih mapel dan kelas yang akan diinput nilainya." />
      ) : !dataSiap ? (
        <Skeleton className="h-40 w-full" />
      ) : mode === "asesmen" && jenisList.length === 0 ? (
        <EmptyState
          title="Belum ada jenis asesmen"
          description={`Jenis asesmen untuk mapel ${pengampuan.mapel_plus.nama} belum dikonfigurasi. Gunakan mode Nilai Akhir Langsung, atau hubungi admin.`}
        />
      ) : siswaList.length === 0 ? (
        <EmptyState
          title="Kelas belum memiliki siswa"
          description={`Belum ada siswa terdaftar di ${labelKelas(pengampuan.kelas_rombel.nama) ?? pengampuan.kelas_rombel.nama}.`}
        />
      ) : mode === "asesmen" && !jenisId ? (
        <EmptyState title="Pilih jenis asesmen" description="Pilih jenis asesmen untuk mulai menginput nilai." />
      ) : !tampilList ? (
        <Skeleton className="h-40 w-full" />
      ) : (
        <div className="space-y-3">
          <Card className="divide-y divide-slate-100">
            {siswaList.map((s) => (
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
            <Button onClick={handleSimpan} loading={saving}>
              {mode === "asesmen" ? "Simpan Nilai" : "Simpan Nilai Akhir"}
            </Button>
            {savedMsg && <p className="text-sm text-emerald-600 font-medium animate-fade-in">{savedMsg}</p>}
          </div>
        </div>
      )}
    </div>
  );
}
