"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { PageHeader, Card, Button, Badge, Skeleton, EmptyState, Table, TableHead, TableBody, Th, Td, TableRow, Modal, Pagination } from "@/components/ui";

const PER_HALAMAN = 10;

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

interface RincianItem {
  jenis: string;
  kategori: "formatif" | "sumatif";
  nilai: number;
  bobot: number;
}

interface RekapItem {
  mapel: string;
  nilai_akhir: number | null;
  predikat: string | null;
  rincian: RincianItem[];
}

interface DeskripsiCapaian {
  id: number;
  mapel_plus_id: number;
  deskripsi: string;
}

interface MapelPlus {
  id: number;
  nama: string;
}

const STATUS_VARIANT: Record<string, "success" | "warning" | "info" | "danger" | "default"> = {
  Draft: "default",
  Diajukan: "warning",
  Divalidasi: "info",
  Ditolak: "danger",
  Diterbitkan: "success",
};

export default function RaporWaliKelasPage() {
  const [siswas, setSiswas] = useState<Siswa[]>([]);
  const [semesterAktif, setSemesterAktif] = useState<Semester | null>(null);
  const [rapors, setRapors] = useState<Rapor[]>([]);
  const [loading, setLoading] = useState(true);

  const [detailSiswa, setDetailSiswa] = useState<Siswa | null>(null);
  const [rekap, setRekap] = useState<RekapItem[]>([]);
  const [deskripsi, setDeskripsi] = useState<Record<number, string>>({});
  const [mapels, setMapels] = useState<MapelPlus[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [deskripsiLoading, setDeskripsiLoading] = useState(false);
  const [savedMsg, setSavedMsg] = useState("");
  const [halaman, setHalaman] = useState(1);

  const halamanTerakhir = Math.max(1, Math.ceil(siswas.length / PER_HALAMAN));
  const halamanAman = Math.min(halaman, halamanTerakhir);
  const siswaTampil = siswas.slice((halamanAman - 1) * PER_HALAMAN, halamanAman * PER_HALAMAN);

  const load = useCallback(() => {
    Promise.all([
      api.get("/kelas-rombel"),
      api.get("/tahun-ajaran"),
    ]).then(async ([kelasRes, taRes]) => {
      const kelasId = kelasRes.data[0]?.id;
      if (kelasId) {
        const siswaRes = await api.get("/siswa", { params: { kelas_rombel_id: kelasId } });
        setSiswas(siswaRes.data.data ?? siswaRes.data);
      }

      const aktif = taRes.data.find((t: { is_aktif: boolean }) => t.is_aktif);
      const semAktif = aktif?.semesters?.find((s: Semester) => s.is_aktif) ?? null;
      setSemesterAktif(semAktif);

      if (semAktif) {
        const raporRes = await api.get<Rapor[]>("/rapors", { params: { semester_id: semAktif.id } });
        setRapors(raporRes.data);
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    api.get<MapelPlus[]>("/mapel-plus").then((res) => setMapels(res.data));
  }, []);

  function bukaDetail(s: Siswa) {
    setDetailSiswa(s);
    setDetailLoading(true);
    setSavedMsg("");
    if (!semesterAktif) return;
    Promise.all([
      api.get<RekapItem[]>(`/siswas/${s.id}/nilai-rekap/${semesterAktif.id}`),
      api.get<DeskripsiCapaian[]>("/deskripsi-capaian", {
        params: { siswa_id: s.id, semester_id: semesterAktif.id },
      }),
    ]).then(([rekapRes, deskRes]) => {
      setRekap(rekapRes.data);
      const peta: Record<number, string> = {};
      deskRes.data.forEach((d) => {
        peta[d.mapel_plus_id] = d.deskripsi;
      });
      setDeskripsi(peta);
      setDetailLoading(false);
    }).catch(() => setDetailLoading(false));
  }

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

  async function simpanDeskripsi() {
    if (!detailSiswa || !semesterAktif) return;
    setDeskripsiLoading(true);
    setSavedMsg("");
    try {
      for (const mapel of mapels) {
        const isi = deskripsi[mapel.id];
        if (!isi) continue;
        await api.post("/deskripsi-capaian", {
          siswa_id: detailSiswa.id,
          mapel_plus_id: mapel.id,
          semester_id: semesterAktif.id,
          deskripsi: isi,
        });
      }
      setSavedMsg("Deskripsi capaian tersimpan.");
    } finally {
      setDeskripsiLoading(false);
    }
  }

  return (
    <div className="animate-fade-in">
      <PageHeader title="Rapor Pesantren" description={`Semester ${semesterAktif?.nama ?? "..."} — lengkapi deskripsi capaian, lalu ajukan untuk validasi.`} />

      {loading ? (
        <Skeleton className="h-40 w-full" />
      ) : siswas.length === 0 ? (
        <EmptyState title="Tidak ada siswa" description="Tidak ada siswa yang perlu diraporkan." />
      ) : (
        <Card className="p-0">
          <Table>
            <TableHead>
              <Th>NIS</Th>
              <Th>Nama</Th>
              <Th>Status</Th>
              <Th>Aksi</Th>
            </TableHead>
            <TableBody>
              {siswaTampil.map((s) => {
                const rapor = raporUntuk(s.id);
                const status = rapor?.status;
                return (
                  <TableRow key={s.id}>
                    <Td className="font-mono text-xs">{s.nis}</Td>
                    <Td className="font-medium">{s.nama}</Td>
                    <Td>
                      <Badge variant={STATUS_VARIANT[status ?? "default"] || "default"}>
                        {status ?? "Belum disusun"}
                      </Badge>
                    </Td>
                    <Td className="whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {!rapor && (
                          <Button size="sm" onClick={() => susunDraft(s.id)}>Susun Draft</Button>
                        )}
                        {(status === "Draft" || status === "Ditolak") && (
                          <Button size="sm" onClick={() => ajukan(rapor!.id)}>
                            {status === "Ditolak" ? "Ajukan Ulang" : "Ajukan"}
                          </Button>
                        )}
                        {status === "Diterbitkan" && (
                          <Link href={`/rapor-cetak/${rapor!.id}`}>
                            <Button size="sm" variant="outline">Cetak</Button>
                          </Link>
                        )}
                        <Button size="sm" variant="outline" onClick={() => bukaDetail(s)}>Detail</Button>
                      </div>
                    </Td>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          <Pagination
            page={halamanAman}
            lastPage={halamanTerakhir}
            total={siswas.length}
            from={siswas.length === 0 ? 0 : (halamanAman - 1) * PER_HALAMAN + 1}
            to={Math.min(halamanAman * PER_HALAMAN, siswas.length)}
            label="siswa"
            onPageChange={setHalaman}
          />
        </Card>
      )}

      <Modal
        open={detailSiswa !== null}
        onClose={() => setDetailSiswa(null)}
        title={`Rekap & Deskripsi — ${detailSiswa?.nama ?? ""}`}
        maxWidth="lg"
      >
        {detailLoading ? (
          <Skeleton className="h-60 w-full" />
        ) : (
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-slate-700 mb-2">Rekap Nilai (Sumatif Tertimbang + Predikat)</h3>
              {rekap.length === 0 ? (
                <p className="text-sm text-slate-400">Belum ada nilai yang diinput untuk semester ini.</p>
              ) : (
                <div className="rounded-xl border border-slate-200 overflow-hidden">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200">
                        <th className="py-2.5 px-4 text-xs font-semibold text-slate-500 uppercase">Mapel</th>
                        <th className="py-2.5 px-4 text-xs font-semibold text-slate-500 uppercase text-center">Nilai Akhir</th>
                        <th className="py-2.5 px-4 text-xs font-semibold text-slate-500 uppercase">Predikat</th>
                        <th className="py-2.5 px-4 text-xs font-semibold text-slate-500 uppercase">Rincian</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {rekap.map((item, i) => (
                        <tr key={i}>
                          <td className="py-2.5 px-4 font-medium text-slate-800">{item.mapel}</td>
                          <td className="py-2.5 px-4 text-center font-semibold text-slate-800">{item.nilai_akhir ?? "-"}</td>
                          <td className="py-2.5 px-4">
                            {item.predikat ? <Badge variant="success">{item.predikat}</Badge> : <span className="text-slate-400">-</span>}
                          </td>
                          <td className="py-2.5 px-4 text-xs text-slate-500">
                            {item.rincian.map((r) => (
                              <span key={r.jenis} className="inline-block mr-2">
                                {r.jenis}: <span className="font-medium text-slate-700">{Number(r.nilai)}</span>
                                {r.kategori === "formatif" && <span className="text-amber-600"> (fmt)</span>}
                              </span>
                            ))}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <p className="text-xs text-slate-400 mt-1.5">(fmt) = formatif, hanya umpan balik proses — dikecualikan dari nilai akhir.</p>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-slate-700 mb-2">Deskripsi Capaian per Mapel</h3>
              <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                {mapels.map((m) => (
                  <div key={m.id}>
                    <label className="block text-xs font-medium text-slate-500 mb-1">{m.nama}</label>
                    <textarea
                      value={deskripsi[m.id] ?? ""}
                      onChange={(e) => setDeskripsi({ ...deskripsi, [m.id]: e.target.value })}
                      placeholder={`Deskripsi capaian ${m.nama}...`}
                      rows={2}
                      className="w-full px-3 py-2 text-sm glass-input resize-none"
                    />
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-3 mt-4">
                <Button onClick={simpanDeskripsi} loading={deskripsiLoading}>Simpan Deskripsi</Button>
                {savedMsg && <p className="text-sm text-emerald-600 font-medium">{savedMsg}</p>}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
