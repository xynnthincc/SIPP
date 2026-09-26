"use client";

import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import { labelKelas } from "@/lib/kelas";
import { labelSemester } from "@/lib/semester";
import { PageHeader, Card, Button, Select, Skeleton, EmptyState, Alert } from "@/components/ui";

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
  const [semesters, setSemesters] = useState<SemesterLite[]>([]);
  const [semesterId, setSemesterId] = useState("");
  const [pengampuanList, setPengampuanList] = useState<Pengampuan[]>([]);
  const [pengampuanId, setPengampuanId] = useState<number | null>(null);
  const [siswaList, setSiswaList] = useState<Siswa[]>([]);
  const [prefill, setPrefill] = useState<Record<number, number | null>>({});
  const [nilai, setNilai] = useState<Record<number, string>>({});
  const [dataKey, setDataKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      api.get<SemesterLite[]>("/semester"),
      api.get<Pengampuan[]>("/pengampuan-saya"),
    ]).then(([sem, peng]) => {
      setSemesters(sem.data);
      const aktif = sem.data.find((s) => s.is_aktif) ?? sem.data[0];
      if (aktif) setSemesterId(String(aktif.id));
      setPengampuanList(peng.data);
      setLoading(false);
    }).catch(() => {
      setError("Gagal memuat data semester/penugasan.");
      setLoading(false);
    });
  }, []);

  const pengampuanTersaring = useMemo(
    () => (semesterId ? pengampuanList.filter((p) => String(p.semester_id) === semesterId) : []),
    [pengampuanList, semesterId]
  );

  const pengampuan = pengampuanTersaring.find((p) => p.id === pengampuanId) ?? null;

  useEffect(() => {
    if (!pengampuan) return;
    let aktif = true;
    const kunci = String(pengampuan.id);

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

    return () => { aktif = false; };
  }, [pengampuan]);

  const dataSiap = pengampuan !== null && dataKey === String(pengampuan.id);

  function pilihSemester(v: string) {
    setSemesterId(v);
    setPengampuanId(null);
    setNilai({});
    setSavedMsg(null);
  }

  function pilihPengampuan(v: string) {
    setPengampuanId(Number(v) || null);
    setNilai({});
    setSavedMsg(null);
  }

  async function handleSimpan() {
    if (!pengampuan || !semesterId || !dataSiap) return;

    setSaving(true);
    setSavedMsg(null);
    setError(null);
    try {
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
      setSavedMsg("Nilai berhasil disimpan.");
    } catch (err: unknown) {
      const pesan = (err as { response?: { data?: { message?: string } } })?.response?.data;
      setError(pesan?.message ?? "Gagal menyimpan nilai.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Input Nilai"
        description="Input nilai akhir mapel langsung — tersimpan & langsung masuk ke rapor."
      />

      {error && (
        <div className="mb-6">
          <Alert variant="danger" onClose={() => setError(null)}>{error}</Alert>
        </div>
      )}

      <Card className="mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
        </div>
      </Card>

      {loading ? (
        <Skeleton className="h-40 w-full" />
      ) : !semesterId ? (
        <EmptyState title="Pilih semester" description="Pilih semester mengajar untuk melihat daftar mapel & kelas." />
      ) : pengampuanTersaring.length === 0 ? (
        <EmptyState title="Tidak ada mapel di semester ini" description="Anda belum memiliki penugasan mengajar pada semester terpilih." />
      ) : !pengampuan ? (
        <EmptyState title="Pilih mapel & kelas" description="Pilih mapel dan kelas yang akan diinput nilainya." />
      ) : !dataSiap ? (
        <Skeleton className="h-40 w-full" />
      ) : siswaList.length === 0 ? (
        <EmptyState
          title="Kelas belum memiliki siswa"
          description={`Belum ada siswa terdaftar di ${labelKelas(pengampuan.kelas_rombel.nama) ?? pengampuan.kelas_rombel.nama}.`}
        />
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
              Simpan Nilai Akhir
            </Button>
            {savedMsg && <p className="text-sm text-emerald-600 font-medium animate-fade-in">{savedMsg}</p>}
          </div>
        </div>
      )}
    </div>
  );
}
