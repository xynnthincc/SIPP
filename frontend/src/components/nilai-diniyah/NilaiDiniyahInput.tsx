"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { labelKelas } from "@/lib/kelas";
import { labelSemester } from "@/lib/semester";
import {
  PageHeader, Card, Button, Select, Skeleton, EmptyState, Alert,
  Table, TableHead, TableBody, Th, Td, TableRow, Badge,
} from "@/components/ui";

interface SemesterLite {
  id: number;
  nama: string;
  jenis: "Akhir" | "Sementara";
  is_aktif: boolean;
  tahun_ajaran: { nama: string } | null;
}

interface KelasLite {
  id: number;
  nama: string;
}

interface SiswaLite {
  id: number;
  nis: string;
  nama: string;
}

interface NilaiMapelRow {
  id: number;
  kode: string;
  nama: string;
  nama_ar: string | null;
  kelompok: string | null;
  kkm_default: number;
  nilai_mapel: { kkm: number; nilai: number | null } | null;
  nilai_akhir: number | null;
  predikat: string | null;
  bisa_edit: boolean;
}

interface NilaiPraktikRow {
  id: number;
  kode: string;
  nama_id: string;
  nama_ar: string | null;
  nilai: string | null;
  keterangan: string | null;
  bisa_edit: boolean;
}

interface RekapDiniyah {
  siswa: { id: number; nama: string; nis: string; kelas: string | null };
  semester: { id: number; nama: string; tahun: string; penilaian_dibuka: boolean };
  mapel: NilaiMapelRow[];
  praktik: NilaiPraktikRow[];
  pembiasaan: { nilai: string | null } | null;
  sikap: { akhlaq: string | null; kepribadian: string | null } | null;
  kehadiran: { sakit: number | null; izin: number | null; alpa: number | null } | null;
  log_edit: { updated_by: number; updated_at: string; updater: { id: number; name: string } | null } | null;
  bisa_edit_pembiasaan: boolean;
}

const PREDIKAT_VARIANT: Record<string, "success" | "warning" | "info" | "danger" | "default"> = {
  A: "success", B: "info", C: "warning", D: "danger",
};

export default function NilaiDiniyahInput() {
  const [semesters, setSemesters] = useState<SemesterLite[]>([]);
  const [semesterId, setSemesterId] = useState("");
  const [kelasList, setKelasList] = useState<KelasLite[]>([]);
  const [kelasId, setKelasId] = useState("");
  const [siswas, setSiswas] = useState<SiswaLite[]>([]);
  const [siswaId, setSiswaId] = useState("");

  const [rekap, setRekap] = useState<RekapDiniyah | null>(null);
  const [nilaiMapel, setNilaiMapel] = useState<Record<number, { kkm: string; nilai: string }>>({});
  const [praktik, setPraktik] = useState<Record<number, { nilai: string; keterangan: string }>>({});
  const [pembiasaan, setPembiasaan] = useState("");
  const [sikap, setSikap] = useState({ akhlaq: "", kepribadian: "" });
  const [kehadiran, setKehadiran] = useState({ sakit: "", izin: "", alpa: "" });

  const [loadingSiswa, setLoadingSiswa] = useState(false);
  const [loadingRekap, setLoadingRekap] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);

  useEffect(() => {
    api.get<SemesterLite[]>("/semester").then((res) => {
      setSemesters(res.data);
      const aktif = res.data.find((s) => s.is_aktif);
      if (aktif) setSemesterId(String(aktif.id));
    }).catch(() => setSemesters([]));
    api.get<KelasLite[]>("/kelas-rombel").then((res) => {
      setKelasList(res.data);
      // Wali kelas hanya punya satu kelas binaan — langsung terpilih otomatis
      if (res.data.length === 1) setKelasId(String(res.data[0].id));
    }).catch(() => setKelasList([]));
  }, []);

  const muatSiswa = useCallback(() => {
    if (!kelasId) return;
    api.get("/siswa", { params: { kelas_rombel_id: kelasId } }).then((res) => {
      const daftar: SiswaLite[] = res.data.data ?? res.data;
      daftar.sort((a, b) => a.nama.localeCompare(b.nama, "id-ID"));
      setSiswas(daftar);
      setLoadingSiswa(false);
    }).catch(() => {
      setSiswas([]);
      setLoadingSiswa(false);
    });
  }, [kelasId]);

  const muatRekap = useCallback(() => {
    if (!siswaId || !semesterId) return;
    api.get<RekapDiniyah>("/nilai-diniyah/rekap", {
      params: { siswa_id: siswaId, semester_id: semesterId },
    }).then((res) => {
      setRekap(res.data);
      const nm: Record<number, { kkm: string; nilai: string }> = {};
      res.data.mapel.forEach((m) => {
        nm[m.id] = {
          kkm: m.bisa_edit ? String(m.nilai_mapel?.kkm ?? m.kkm_default) : "",
          nilai: m.nilai_mapel?.nilai !== null && m.nilai_mapel?.nilai !== undefined ? String(m.nilai_mapel.nilai) : "",
        };
      });
      setNilaiMapel(nm);
      const pk: Record<number, { nilai: string; keterangan: string }> = {};
      res.data.praktik.forEach((p) => {
        pk[p.id] = { nilai: p.nilai ?? "", keterangan: p.keterangan ?? "" };
      });
      setPraktik(pk);
      setPembiasaan(res.data.pembiasaan?.nilai ?? "");
      setSikap({ akhlaq: res.data.sikap?.akhlaq ?? "", kepribadian: res.data.sikap?.kepribadian ?? "" });
      setKehadiran({
        sakit: res.data.kehadiran?.sakit !== null && res.data.kehadiran?.sakit !== undefined ? String(res.data.kehadiran.sakit) : "",
        izin: res.data.kehadiran?.izin !== null && res.data.kehadiran?.izin !== undefined ? String(res.data.kehadiran.izin) : "",
        alpa: res.data.kehadiran?.alpa !== null && res.data.kehadiran?.alpa !== undefined ? String(res.data.kehadiran.alpa) : "",
      });
      setError(null);
      setSavedMsg(null);
      setLoadingRekap(false);
    }).catch((err: unknown) => {
      const pesan = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setRekap(null);
      setError(pesan ?? "Gagal memuat rekap nilai diniyah untuk siswa ini.");
      setLoadingRekap(false);
    });
  }, [siswaId, semesterId]);

  useEffect(() => { muatSiswa(); }, [muatSiswa]);
  useEffect(() => { muatRekap(); }, [muatRekap]);

  const pembiasaanBoleh = rekap?.bisa_edit_pembiasaan ?? false;
  const penilaianBuka = rekap?.semester.penilaian_dibuka ?? false;

  async function handleSimpan() {
    if (!rekap) return;
    setSaving(true);
    setError(null);
    setSavedMsg(null);
    try {
      const body: Record<string, unknown> = {
        siswa_id: rekap.siswa.id,
        semester_id: rekap.semester.id,
        nilai_mapel: rekap.mapel
          .filter((m) => m.bisa_edit)
          .map((m) => {
            const row = nilaiMapel[m.id];
            return {
              mapel_plus_id: m.id,
              kkm: row ? Number(row.kkm) : m.kkm_default,
              nilai: row?.nilai !== "" ? Number(row.nilai) : null,
            };
          }),
        nilai_praktik: rekap.praktik
          .filter((p) => p.bisa_edit && (praktik[p.id]?.nilai !== "" || praktik[p.id]?.keterangan !== ""))
          .map((p) => ({
            praktik_item_id: p.id,
            nilai: praktik[p.id]?.nilai || null,
            keterangan: praktik[p.id]?.keterangan || null,
          })),
      };
      if (pembiasaanBoleh) {
        body.pembiasaan = { nilai: pembiasaan !== "" ? pembiasaan : null };
        body.sikap = { akhlaq: sikap.akhlaq || null, kepribadian: sikap.kepribadian || null };
        body.kehadiran = {
          sakit: Number(kehadiran.sakit) || 0,
          izin: Number(kehadiran.izin) || 0,
          alpa: Number(kehadiran.alpa) || 0,
        };
      }
      await api.post("/nilai-diniyah/simpan", body);
      setSavedMsg("Nilai diniyah berhasil disimpan.");
      setLoadingRekap(true);
      await muatRekap();
    } catch (err: unknown) {
      const pesan = (err as { response?: { data?: { message?: string } } })?.response?.data;
      setError(pesan?.message ?? "Gagal menyimpan nilai diniyah.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Input Nilai Diniyah"
        description="Nilai mapel plus, praktik & hafalan, pembiasaan, sikap, dan kehadiran — satu klik per siswa."
      />

      <Card className="mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Select label="Semester" value={semesterId} onChange={(e) => { setSemesterId(e.target.value); setRekap(null); setError(null); setSavedMsg(null); }} placeholder="Pilih semester" disabled={semesters.length === 0}>
            {semesters.map((s) => (
              <option key={s.id} value={s.id}>
                  {labelSemester(s)}
              </option>
            ))}
          </Select>
          <Select label="Kelas" value={kelasId} onChange={(e) => { setKelasId(e.target.value); setSiswaId(""); setRekap(null); if (!e.target.value) setSiswas([]); else setLoadingSiswa(true); setError(null); setSavedMsg(null); }} placeholder="Pilih kelas">
            {kelasList.map((k) => (
              <option key={k.id} value={k.id}>{labelKelas(k.nama) ?? k.nama}</option>
            ))}
          </Select>
          <Select label="Siswa" value={siswaId} onChange={(e) => { setSiswaId(e.target.value); setRekap(null); if (e.target.value && semesterId) setLoadingRekap(true); setError(null); setSavedMsg(null); }} placeholder={loadingSiswa ? "Memuat siswa…" : "Pilih siswa"} disabled={!kelasId || loadingSiswa}>
            {siswas.map((s) => (
              <option key={s.id} value={s.id}>{`${s.nama} (NIS ${s.nis})`}</option>
            ))}
          </Select>
        </div>
      </Card>

      {error && (
        <div className="mb-6">
          <Alert variant="danger" onClose={() => setError(null)}>{error}</Alert>
        </div>
      )}

      {loadingRekap ? (
        <Skeleton className="h-64 w-full" />
      ) : !rekap ? (
        siswaId ? (
          <EmptyState title="Gagal memuat rekap" description="Rekap nilai diniyah tidak dapat dimuat. Coba pilih siswa kembali." />
        ) : (
          <EmptyState title="Pilih kelas & siswa" description="Pilih semester, kelas, lalu siswa untuk mulai menginput nilai diniyah." />
        )
      ) : (
        <div className="space-y-6">
          {!penilaianBuka && (
            <Alert variant="warning">Periode penilaian semester {rekap.semester.nama} sudah ditutup. Data hanya bisa dilihat.</Alert>
          )}

          <Card>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-slate-800">Nilai Mapel Plus</h3>
                <p className="text-xs text-slate-400">Nilai terisi = nilai akhir langsung dari guru mapel (menimpa perhitungan asesmen); jika kosong memakai agregasi sumatif asesmen.</p>
              </div>
              {rekap.log_edit && (
                <p className="text-xs text-slate-400 text-right">
                  Diubah oleh <span className="font-medium text-slate-600">{rekap.log_edit.updater?.name ?? `User #${rekap.log_edit.updated_by}`}</span>
                  <br />{new Date(rekap.log_edit.updated_at).toLocaleString("id-ID")}
                </p>
              )}
            </div>
            <Table>
              <TableHead>
                <Th>Mapel</Th>
                <Th className="text-center">KKM</Th>
                <Th className="text-center">Nilai</Th>
                <Th className="text-center">Nilai Akhir</Th>
                <Th className="text-center">Predikat</Th>
              </TableHead>
              <TableBody>
                {rekap.mapel.map((m) => {
                  const row = nilaiMapel[m.id];
                  return (
                    <TableRow key={m.id}>
                      <Td>
                        <div className="font-medium text-slate-800">{m.nama}</div>
                        {m.nama_ar && <div className="text-sm text-slate-500 font-medium" dir="rtl">{m.nama_ar}</div>}
                      </Td>
                      <Td className="text-center">
                        {m.bisa_edit ? (
                          <input
                            type="number"
                            min={1}
                            max={100}
                            value={row?.kkm ?? ""}
                            onChange={(e) => setNilaiMapel({ ...nilaiMapel, [m.id]: { kkm: e.target.value, nilai: row?.nilai ?? "" } })}
                            className="w-16 px-2 py-1 text-sm text-center glass-input rounded-lg"
                            disabled={!penilaianBuka}
                          />
                        ) : (
                          <span className="text-sm text-slate-400">{m.nilai_mapel?.kkm ?? m.kkm_default}</span>
                        )}
                      </Td>
                      <Td className="text-center">
                        {m.bisa_edit ? (
                          <input
                            type="number"
                            min={0}
                            max={100}
                            value={row?.nilai ?? ""}
                            onChange={(e) => setNilaiMapel({ ...nilaiMapel, [m.id]: { kkm: row?.kkm ?? "", nilai: e.target.value } })}
                            className="w-16 px-2 py-1 text-sm text-center glass-input rounded-lg"
                            placeholder="-"
                            disabled={!penilaianBuka}
                          />
                        ) : (
                          <span className="text-sm text-slate-400">-</span>
                        )}
                      </Td>
                      <Td className="text-center font-semibold text-slate-800">
                        {m.nilai_akhir ?? "-"}
                        {m.nilai_akhir !== null && m.nilai_mapel?.nilai == null && (
                          <span className="block text-[10px] font-normal text-slate-400">dari asesmen</span>
                        )}
                      </Td>
                      <Td className="text-center">
                        {m.predikat ? (
                          <Badge variant={PREDIKAT_VARIANT[m.predikat] ?? "default"}>{m.predikat}</Badge>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </Td>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Card>

          <Card>
            <h3 className="text-sm font-semibold text-slate-800 mb-4">Praktik & Hafalan</h3>
            <Table>
              <TableHead>
                <Th>Item</Th>
                <Th className="text-center">Nilai</Th>
                <Th>Keterangan</Th>
              </TableHead>
              <TableBody>
                {rekap.praktik.map((p) => {
                  const row = praktik[p.id];
                  return (
                    <TableRow key={p.id}>
                      <Td>
                        <div className="font-medium text-slate-800">{p.nama_id}</div>
                        {p.nama_ar && <div className="text-sm text-slate-500 font-medium" dir="rtl">{p.nama_ar}</div>}
                      </Td>
                      <Td className="text-center">
                        {p.bisa_edit ? (
                          <Select
                            value={row?.nilai ?? ""}
                            onChange={(e) => setPraktik({ ...praktik, [p.id]: { nilai: e.target.value, keterangan: row?.keterangan ?? "" } })}
                            className="w-24"
                            disabled={!penilaianBuka}
                          >
                            <option value="">-</option>
                            <option value="A">A</option>
                            <option value="B">B</option>
                            <option value="C">C</option>
                            <option value="D">D</option>
                          </Select>
                        ) : (
                          <span className="text-sm text-slate-400">{p.nilai ?? "-"}</span>
                        )}
                      </Td>
                      <Td>
                        {p.bisa_edit ? (
                          <input
                            type="text"
                            value={row?.keterangan ?? ""}
                            onChange={(e) => setPraktik({ ...praktik, [p.id]: { nilai: row?.nilai ?? "", keterangan: e.target.value } })}
                            placeholder="Keterangan singkat (opsional)"
                            className="w-full px-3 py-1.5 text-sm glass-input rounded-lg"
                            disabled={!penilaianBuka}
                          />
                        ) : (
                          <span className="text-sm text-slate-400">{p.keterangan ?? "-"}</span>
                        )}
                      </Td>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            <p className="text-xs text-slate-400 mt-2">Nilai praktik/hafalan menggunakan lambang A/B/C/D sesuai konvensi aplikasi lama.</p>
          </Card>

          {pembiasaanBoleh && (
            <Card>
              <h3 className="text-sm font-semibold text-slate-800 mb-4">Pembiasaan, Sikap & Kehadiran</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Predikat Pembiasaan Pagi</label>
                  <Select value={pembiasaan} onChange={(e) => setPembiasaan(e.target.value)} disabled={!penilaianBuka}>
                    <option value="">-</option>
                    <option value="A">A</option>
                    <option value="B">B</option>
                    <option value="C">C</option>
                    <option value="D">D</option>
                  </Select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Sikap — Akhlaq</label>
                  <Select value={sikap.akhlaq} onChange={(e) => setSikap({ ...sikap, akhlaq: e.target.value })} disabled={!penilaianBuka}>
                    <option value="">-</option>
                    <option value="A">A</option>
                    <option value="B">B</option>
                    <option value="C">C</option>
                    <option value="D">D</option>
                  </Select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Sikap — Kepribadian</label>
                  <Select value={sikap.kepribadian} onChange={(e) => setSikap({ ...sikap, kepribadian: e.target.value })} disabled={!penilaianBuka}>
                    <option value="">-</option>
                    <option value="A">A</option>
                    <option value="B">B</option>
                    <option value="C">C</option>
                    <option value="D">D</option>
                  </Select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Kehadiran (Sakit / Izin / Alpa)</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(["sakit", "izin", "alpa"] as const).map((k) => (
                      <input
                        key={k}
                        type="number"
                        min={0}
                        title={k}
                        aria-label={`Kehadiran ${k}`}
                        placeholder={k.charAt(0).toUpperCase()}
                        value={kehadiran[k]}
                        onChange={(e) => setKehadiran({ ...kehadiran, [k]: e.target.value })}
                        className="w-full px-2 py-2.5 text-sm text-center glass-input rounded-xl"
                        disabled={!penilaianBuka}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          )}

          {penilaianBuka ? (
            <div className="flex items-center gap-3">
              <Button onClick={handleSimpan} loading={saving}>Simpan Nilai Diniyah</Button>
              {savedMsg && <p className="text-sm text-emerald-600 font-medium animate-fade-in">{savedMsg}</p>}
            </div>
          ) : (
            <p className="text-sm text-amber-700 font-medium">Penilaian ditutup — tidak ada yang bisa disimpan.</p>
          )}
        </div>
      )}
    </div>
  );
}