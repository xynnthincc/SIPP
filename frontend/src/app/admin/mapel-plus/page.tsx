"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import {
  PageHeader, Card, Button, Table, TableHead, TableBody, Th, Td, TableRow,
  Badge, Skeleton, EmptyState, ConfirmModal, IconButton, Alert,
} from "@/components/ui";

interface MapelPlus {
  id: number;
  kode: string;
  nama: string;
  nama_ar: string | null;
  kelompok: string | null;
  kkm_default: number;
  urutan: number;
  deskripsi: string | null;
  punya_progres_hafalan: boolean;
  jenis_assessments_count: number;
}

interface JenisAssessment {
  id: number;
  nama: string;
  kategori: "formatif" | "sumatif";
  bobot: number;
}

export default function MapelPlusPage() {
  const router = useRouter();
  const [data, setData] = useState<MapelPlus[]>([]);
  const [loading, setLoading] = useState(true);

  const [mapelTerbuka, setMapelTerbuka] = useState<number | null>(null);
  const [jenisList, setJenisList] = useState<JenisAssessment[]>([]);
  const [loadingJenis, setLoadingJenis] = useState(false);
  const [hapus, setHapus] = useState<{ tipe: "mapel" | "jenis"; id: number; nama: string } | null>(null);
  const [hapusLoading, setHapusLoading] = useState(false);
  const [hapusError, setHapusError] = useState<string | null>(null);

  const load = useCallback(() => {
    api.get<MapelPlus[]>("/mapel-plus").then((res) => {
      setData(res.data);
      setLoading(false);
    });
  }, []);

  useEffect(() => { load(); }, [load]);

  function muatJenis(mapelId: number) {
    setLoadingJenis(true);
    api.get<JenisAssessment[]>("/jenis-assessment", { params: { mapel_plus_id: mapelId } })
      .then((res) => setJenisList(res.data))
      .finally(() => setLoadingJenis(false));
  }

  function toggleMapel(id: number) {
    if (mapelTerbuka === id) {
      setMapelTerbuka(null);
      return;
    }
    setMapelTerbuka(id);
    muatJenis(id);
  }

  async function handleHapus() {
    if (!hapus) return;
    setHapusLoading(true);
    setHapusError(null);
    try {
      if (hapus.tipe === "mapel") {
        await api.delete(`/mapel-plus/${hapus.id}`);
        if (mapelTerbuka === hapus.id) setMapelTerbuka(null);
      } else {
        await api.delete(`/jenis-assessment/${hapus.id}`);
        if (mapelTerbuka !== null) muatJenis(mapelTerbuka);
      }
      setHapus(null);
      await load();
    } catch (err: unknown) {
      const pesan = (err as { response?: { data?: { message?: string } } })?.response?.data;
      setHapusError(pesan?.message ?? "Gagal menghapus.");
    } finally {
      setHapusLoading(false);
    }
  }

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Mata Pelajaran Plus"
        description="Tahfidz, Tahsin, Kitab Kuning, Bahasa Arab, Akhlak — beserta jenis assessment (formatif/sumatif)."
        action={<Button onClick={() => router.push("/admin/mapel-plus/form")}>+ Tambah Mapel</Button>}
      />

      {hapusError && (
        <div className="mb-6">
          <Alert variant="danger" onClose={() => setHapusError(null)}>{hapusError}</Alert>
        </div>
      )}

      {loading ? (
        <Skeleton className="h-40 w-full" />
      ) : data.length === 0 ? (
        <EmptyState
          title="Belum ada mapel plus"
          description="Tambahkan mata pelajaran kepesantrenan baru."
          action={<Button onClick={() => router.push("/admin/mapel-plus/form")}>+ Tambah Mapel</Button>}
        />
      ) : (
        <div className="space-y-3">
          {data.map((m) => {
            const terbuka = mapelTerbuka === m.id;
            return (
              <Card key={m.id} className="p-0">
                <div className="flex items-center justify-between gap-3 px-5 py-4">
                  <button
                    onClick={() => toggleMapel(m.id)}
                    className="flex flex-col items-start gap-2 text-left cursor-pointer min-w-0"
                  >
                    <span className="flex items-center gap-2">
                      <span className="font-mono text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-2.5 py-0.5">
                        {m.kode}
                      </span>
                      {m.punya_progres_hafalan && (
                        <span className="text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2.5 py-0.5">
                          Hafalan
                        </span>
                      )}
                    </span>
                    <span className="flex flex-wrap items-baseline gap-x-2.5 min-w-0 w-full">
                      <span className="font-semibold text-slate-800">{m.nama}</span>
                      {m.nama_ar && (
                        <>
                          <span className="text-slate-300 select-none">|</span>
                          <span className="text-sm text-slate-500 font-medium" dir="rtl">{m.nama_ar}</span>
                        </>
                      )}
                    </span>
                    <span className="text-xs text-slate-500">
                      KKM <span className="font-semibold text-slate-700">{Number(m.kkm_default)}</span>
                      <span className="mx-1.5 text-slate-300">•</span>
                      Urutan <span className="font-semibold text-slate-700">{Number(m.urutan)}</span>
                      <span className="mx-1.5 text-slate-300">•</span>
                      <span className="font-semibold text-slate-700">{m.jenis_assessments_count}</span> jenis assessment
                    </span>
                  </button>
                  <div className="flex items-center gap-1 shrink-0">
                    <IconButton icon="edit" variant="edit" label="Edit mapel" onClick={() => router.push(`/admin/mapel-plus/form?id=${m.id}`)} />
                    <IconButton
                      icon="trash"
                      variant="delete"
                      label="Hapus mapel"
                      onClick={() => { setHapus({ tipe: "mapel", id: m.id, nama: m.nama }); setHapusError(null); }}
                    />
                    <button
                      onClick={() => toggleMapel(m.id)}
                      className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                      aria-label={terbuka ? "Tutup detail" : "Buka detail"}
                    >
                      <svg
                        className={`w-5 h-5 transition-transform ${terbuka ? "rotate-180" : ""}`}
                        fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                      </svg>
                    </button>
                  </div>
                </div>

                {terbuka && (
                  <div className="px-5 pb-5 border-t border-slate-100 pt-4 animate-slide-up">
                    {loadingJenis ? (
                      <Skeleton className="h-24 w-full" />
                    ) : (
                      <>
                        <div className="flex items-center justify-between mb-3">
                          <p className="text-sm font-medium text-slate-600">Jenis Assessment</p>
                          <Button size="sm" variant="outline" onClick={() => router.push(`/admin/mapel-plus/jenis-form?mapel_id=${m.id}`)}>+ Tambah Jenis</Button>
                        </div>
                        {jenisList.length === 0 ? (
                          <p className="text-sm text-slate-400 mb-2">Belum ada jenis assessment untuk mapel ini.</p>
                        ) : (
                          <div className="rounded-xl border border-slate-100 overflow-hidden">
                            <Table>
                              <TableHead>
                                <Th>Jenis Assessment</Th>
                                <Th>Kategori</Th>
                                <Th className="text-right">Bobot</Th>
                                <Th className="text-right">Aksi</Th>
                              </TableHead>
                              <TableBody>
                                {jenisList.map((j) => (
                                  <TableRow key={j.id}>
                                    <Td className="font-medium">{j.nama}</Td>
                                    <Td>
                                      <Badge variant={j.kategori === "sumatif" ? "info" : "warning"}>
                                        {j.kategori === "sumatif" ? "Sumatif" : "Formatif"}
                                      </Badge>
                                    </Td>
                                    <Td className="text-right">
                                      {j.kategori === "formatif" ? (
                                        <span className="text-slate-400 text-xs">Tidak dihitung</span>
                                      ) : (
                                        <span className="font-semibold">{Number(j.bobot)}%</span>
                                      )}
                                    </Td>
                                    <Td>
                                      <div className="flex items-center justify-end gap-1">
                                        <IconButton icon="edit" variant="edit" label="Edit jenis assessment" onClick={() => router.push(`/admin/mapel-plus/jenis-form?mapel_id=${m.id}&id=${j.id}`)} />
                                        <IconButton
                                          icon="trash"
                                          variant="delete"
                                          label="Hapus jenis assessment"
                                          onClick={() => { setHapus({ tipe: "jenis", id: j.id, nama: j.nama }); setHapusError(null); }}
                                        />
                                      </div>
                                    </Td>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      <ConfirmModal
        open={hapus !== null}
        onClose={() => setHapus(null)}
        onConfirm={handleHapus}
        loading={hapusLoading}
        title={hapus?.tipe === "mapel" ? "Hapus Mata Pelajaran" : "Hapus Jenis Assessment"}
        message={`Yakin ingin menghapus "${hapus?.nama}"?`}
      />
    </div>
  );
}