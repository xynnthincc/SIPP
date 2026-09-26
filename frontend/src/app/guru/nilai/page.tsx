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

interface MassalRow {
  siswa_id: number;
  nama: string;
  nis: string;
  nilai: number | null;
  kkm: number | null;
}

interface Siswa {
  id: number;
  nama: string;
  nis: string;
}

interface MapelKolom {
  id: number;
  nama: string;
}

export default function NilaiGuruPage() {
  const [semesters, setSemesters] = useState<SemesterLite[]>([]);
  const [semesterId, setSemesterId] = useState("");
  const [pengampuanList, setPengampuanList] = useState<Pengampuan[]>([]);
  const [kelasId, setKelasId] = useState<number | null>(null);
  const [siswaList, setSiswaList] = useState<Siswa[]>([]);
  const [mapelList, setMapelList] = useState<MapelKolom[]>([]);
  // matriks[mapelId][siswaId] = ketikan saat ini; prefill = nilai tersimpan
  const [matriks, setMatriks] = useState<Record<number, Record<number, string>>>({});
  const [prefill, setPrefill] = useState<Record<number, Record<number, number | null>>>({});
  const [dataKey, setDataKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [memuatNilai, setMemuatNilai] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      api.get<SemesterLite[]>("/semester"),
      // Semua penugasan guru (bisa banyak mapel & kelas) — kelas jadi kunci tampilan
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

  // Daftar kelas unik yang diampu guru pada semester terpilih
  const kelasTersaring = useMemo(() => {
    const map = new Map<number, { id: number; nama: string }>();
    pengampuanList
      .filter((p) => String(p.semester_id) === semesterId)
      .forEach((p) => {
        if (!map.has(p.kelas_rombel.id)) {
          map.set(p.kelas_rombel.id, { id: p.kelas_rombel.id, nama: p.kelas_rombel.nama });
        }
      });
    return [...map.values()].sort((a, b) => a.nama.localeCompare(b.nama));
  }, [pengampuanList, semesterId]);

  async function muatKelas(kId: number, semId: string, daftar: Pengampuan[]) {
    // Kolom = mapel-mapel yang diampu guru di kelas ini (urut nama biar stabil)
    const mapels = daftar
      .filter((p) => String(p.semester_id) === semId && p.kelas_rombel.id === kId)
      .map((p) => ({ id: p.mapel_plus.id, nama: p.mapel_plus.nama }))
      .filter((m, i, arr) => arr.findIndex((x) => x.id === m.id) === i)
      .sort((a, b) => a.nama.localeCompare(b.nama));

    setMapelList(mapels);
    setSiswaList([]);
    setMemuatNilai(true);
    setSavedMsg(null);
    const kunci = `${semId}:${kId}`;

    try {
      const hasil = await Promise.all(
        mapels.map((m) =>
          api.get<MassalRow[]>("/nilai-diniyah/massal", {
            params: { mapel_plus_id: m.id, kelas_rombel_id: kId, semester_id: Number(semId) },
          }).then((res) => ({ mapelId: m.id, rows: res.data }))
        )
      );
      if (hasil.length === 0) {
        setDataKey(kunci);
        return;
      }
      const pertama = hasil[0].rows;
      setSiswaList(pertama.map((r) => ({ id: r.siswa_id, nama: r.nama, nis: r.nis })));
      const isi: Record<number, Record<number, string>> = {};
      const awal: Record<number, Record<number, number | null>> = {};
      hasil.forEach(({ mapelId, rows }) => {
        isi[mapelId] = {};
        awal[mapelId] = {};
        rows.forEach((r) => {
          isi[mapelId][r.siswa_id] = r.nilai !== null ? String(r.nilai) : "";
          awal[mapelId][r.siswa_id] = r.nilai;
        });
      });
      setMatriks(isi);
      setPrefill(awal);
      setDataKey(kunci);
    } catch {
      setError("Gagal memuat nilai kelas ini. Coba lagi.");
      setDataKey(kunci);
    } finally {
      setMemuatNilai(false);
    }
  }

  const dataSiap = kelasId !== null && dataKey === `${semesterId}:${kelasId}`;

  function pilihSemester(v: string) {
    setSemesterId(v);
    setKelasId(null);
    setSiswaList([]);
    setMapelList([]);
    setMatriks({});
    setPrefill({});
    setDataKey(null);
    setSavedMsg(null);
  }

  function pilihKelas(v: string) {
    const kId = Number(v) || null;
    setKelasId(kId);
    setSiswaList([]);
    setMatriks({});
    setPrefill({});
    setDataKey(null);
    setSavedMsg(null);
    if (kId !== null) void muatKelas(kId, semesterId, pengampuanList);
  }

  function ubahNilai(mapelId: number, siswaId: number, v: string) {
    setMatriks((prev) => ({
      ...prev,
      [mapelId]: { ...(prev[mapelId] ?? {}), [siswaId]: v },
    }));
    setSavedMsg(null);
  }

  function terisiCount(mapelId: number): number {
    return siswaList.filter((s) => (matriks[mapelId]?.[s.id] ?? "") !== "").length;
  }

  async function handleSimpan() {
    if (kelasId === null || !dataSiap) return;

    // Satu request per mapel (paralel); mapel tanpa baris dilewati
    const tugas = mapelList
      .map((m) => ({
        mapel: m,
        rows: siswaList
          .filter((s) => (matriks[m.id]?.[s.id] ?? "") !== "" || prefill[m.id]?.[s.id] != null)
          .map((s) => ({
            siswa_id: s.id,
            nilai: (matriks[m.id]?.[s.id] ?? "") === "" ? null : Number(matriks[m.id]?.[s.id] ?? ""),
          })),
      }))
      .filter((t) => t.rows.length > 0);

    if (tugas.length === 0) {
      setSavedMsg("Tidak ada nilai untuk disimpan.");
      return;
    }

    setSaving(true);
    setSavedMsg(null);
    setError(null);
    try {
      const hasil = await Promise.all(
        tugas.map(async (t) => {
          try {
            await api.post("/nilai-diniyah/massal", {
              mapel_plus_id: t.mapel.id,
              kelas_rombel_id: kelasId,
              semester_id: Number(semesterId),
              nilai: t.rows,
            });
            return { ok: true as const, mapel: t.mapel };
          } catch (err: unknown) {
            const pesan = (err as { response?: { data?: { message?: string } } })?.response?.data;
            return { ok: false as const, mapel: t.mapel, pesan: pesan?.message ?? "Gagal menyimpan" };
          }
        })
      );
      const gagal = hasil.filter((h) => !h.ok);
      const berhasil = hasil.length - gagal.length;
      if (gagal.length === 0) {
        setSavedMsg(`Nilai ${berhasil} mapel tersimpan & langsung masuk rapor.`);
        // Sinkronkan prefill agar penyimpanan berikutnya hanya kirim perubahan
        const pf: Record<number, Record<number, number | null>> = {};
        tugas.forEach((t) => {
          pf[t.mapel.id] = {};
          t.rows.forEach((r) => { pf[t.mapel.id][r.siswa_id] = r.nilai; });
        });
        setPrefill((prev) => {
          const gabung = { ...prev };
          Object.entries(pf).forEach(([mid, isi]) => {
            gabung[Number(mid)] = { ...(gabung[Number(mid)] ?? {}), ...isi };
          });
          return gabung;
        });
      } else {
        if (berhasil > 0) setSavedMsg(`Nilai ${berhasil} mapel tersimpan.`);
        setError(`Sebagian gagal disimpan: ${gagal.map((g) => `${g.mapel.nama} (${g.pesan})`).join("; ")}`);
      }
    } finally {
      setSaving(false);
    }
  }

  const namaKelas = kelasTersaring.find((k) => k.id === kelasId)?.nama ?? "";

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Input Nilai"
        description="Pilih kelas — semua mapel yang Anda ampu di kelas itu tampil sekaligus. Satu kali simpan untuk semua mapel."
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
            label="Kelas yang Diampu"
            value={kelasId ?? ""}
            onChange={(e) => pilihKelas(e.target.value)}
            placeholder="Pilih kelas"
            disabled={!semesterId || kelasTersaring.length === 0}
          >
            {kelasTersaring.map((k) => (
              <option key={k.id} value={k.id}>
                {labelKelas(k.nama) ?? k.nama}
              </option>
            ))}
          </Select>
        </div>
        <p className="text-xs text-slate-400 mt-3">
          Kosongkan kotak untuk menghapus nilai. Nilai tersimpan langsung dipakai rapor.
        </p>
      </Card>

      {loading ? (
        <Skeleton className="h-40 w-full" />
      ) : !semesterId ? (
        <EmptyState title="Pilih semester" description="Pilih semester mengajar untuk melihat daftar kelas yang Anda ampu." />
      ) : kelasTersaring.length === 0 ? (
        <EmptyState title="Tidak ada kelas di semester ini" description="Anda belum memiliki penugasan mengajar pada semester terpilih." />
      ) : kelasId === null ? (
        <EmptyState title="Pilih kelas" description="Pilih kelas untuk menampilkan seluruh siswa beserta nilai tiap mapel yang Anda ampu." />
      ) : memuatNilai || !dataSiap ? (
        <Skeleton className="h-40 w-full" />
      ) : siswaList.length === 0 ? (
        <EmptyState
          title="Kelas belum memiliki siswa"
          description={`Belum ada siswa terdaftar di ${labelKelas(namaKelas) ?? namaKelas}.`}
        />
      ) : (
        <div className="space-y-3">
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="min-w-full border-collapse bg-white text-sm">
              <thead>
                <tr className="bg-slate-50">
                  <th className="sticky left-0 z-20 bg-slate-50 text-left font-semibold text-slate-700 px-4 py-3 min-w-52 border-r border-slate-200">
                    Siswa · {siswaList.length}
                  </th>
                  {mapelList.map((m) => (
                    <th key={m.id} className="px-3 py-3 text-center min-w-28">
                      <div className="font-semibold text-slate-700 truncate max-w-36" title={m.nama}>{m.nama}</div>
                      <div className="text-[11px] font-normal text-slate-400 mt-0.5">
                        {terisiCount(m.id)}/{siswaList.length} terisi
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {siswaList.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/60">
                    <td className="sticky left-0 z-10 bg-white px-4 py-2.5 border-r border-slate-200">
                      <p className="font-medium text-slate-800 truncate max-w-52" title={s.nama}>{s.nama}</p>
                      <p className="text-[11px] text-slate-400 font-mono">NIS {s.nis}</p>
                    </td>
                    {mapelList.map((m) => (
                      <td key={m.id} className="px-3 py-2 text-center">
                        <input
                          type="number"
                          min={0}
                          max={100}
                          value={matriks[m.id]?.[s.id] ?? ""}
                          onChange={(e) => ubahNilai(m.id, s.id, e.target.value)}
                          className="w-20 px-2 py-1.5 text-sm text-center glass-input rounded-lg"
                          placeholder="—"
                          aria-label={`Nilai ${m.nama} untuk ${s.nama}`}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button onClick={handleSimpan} loading={saving}>
              Simpan Semua Nilai ({mapelList.length} mapel)
            </Button>
            {savedMsg && <p className="text-sm text-emerald-600 font-medium animate-fade-in">{savedMsg}</p>}
          </div>
        </div>
      )}
    </div>
  );
}
