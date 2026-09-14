"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import {
  PageHeader, Card, Button, Input, Select, Table, TableHead, TableBody, Th, Td, TableRow,
  Badge, Skeleton, EmptyState, Modal, ConfirmModal, IconButton, Alert,
} from "@/components/ui";

interface MapelPlus {
  id: number;
  kode: string;
  nama: string;
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

const emptyMapel = { kode: "", nama: "", punya_progres_hafalan: false };

export default function MapelPlusPage() {
  const [data, setData] = useState<MapelPlus[]>([]);
  const [loading, setLoading] = useState(true);
  const [mapelModal, setMapelModal] = useState(false);
  const [editingMapel, setEditingMapel] = useState<MapelPlus | null>(null);
  const [mapelForm, setMapelForm] = useState(emptyMapel);
  const [mapelError, setMapelError] = useState<string | null>(null);
  const [savingMapel, setSavingMapel] = useState(false);

  const [mapelTerbuka, setMapelTerbuka] = useState<number | null>(null);
  const [jenisList, setJenisList] = useState<JenisAssessment[]>([]);
  const [loadingJenis, setLoadingJenis] = useState(false);
  const [jenisModal, setJenisModal] = useState(false);
  const [editingJenis, setEditingJenis] = useState<JenisAssessment | null>(null);
  const [jenisForm, setJenisForm] = useState({ nama: "", kategori: "sumatif", bobot: "100" });
  const [jenisError, setJenisError] = useState<string | null>(null);
  const [savingJenis, setSavingJenis] = useState(false);
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

  function bukaTambahMapel() {
    setEditingMapel(null);
    setMapelForm(emptyMapel);
    setMapelError(null);
    setMapelModal(true);
  }

  function mulaiEditMapel(m: MapelPlus) {
    setEditingMapel(m);
    setMapelForm({ kode: m.kode, nama: m.nama, punya_progres_hafalan: m.punya_progres_hafalan });
    setMapelError(null);
    setMapelModal(true);
  }

  function tutupMapelModal() {
    setMapelModal(false);
    setEditingMapel(null);
    setMapelForm(emptyMapel);
    setMapelError(null);
  }

  async function handleMapelSubmit(e: FormEvent) {
    e.preventDefault();
    setSavingMapel(true);
    setMapelError(null);
    try {
      if (editingMapel) {
        await api.put(`/mapel-plus/${editingMapel.id}`, {
          nama: mapelForm.nama,
          punya_progres_hafalan: mapelForm.punya_progres_hafalan,
        });
      } else {
        await api.post("/mapel-plus", mapelForm);
      }
      tutupMapelModal();
      await load();
    } catch (err: unknown) {
      const pesan = (err as { response?: { data?: { message?: string } } })?.response?.data;
      setMapelError(pesan?.message ?? "Gagal menyimpan mapel.");
    } finally {
      setSavingMapel(false);
    }
  }

  function bukaTambahJenis() {
    if (mapelTerbuka === null) return;
    setEditingJenis(null);
    setJenisForm({ nama: "", kategori: "sumatif", bobot: "100" });
    setJenisError(null);
    setJenisModal(true);
  }

  function mulaiEditJenis(j: JenisAssessment) {
    setEditingJenis(j);
    setJenisForm({ nama: j.nama, kategori: j.kategori, bobot: String(j.bobot) });
    setJenisError(null);
    setJenisModal(true);
  }

  function tutupJenisModal() {
    setJenisModal(false);
    setEditingJenis(null);
    setJenisForm({ nama: "", kategori: "sumatif", bobot: "100" });
    setJenisError(null);
  }

  async function handleJenisSubmit(e: FormEvent) {
    e.preventDefault();
    if (mapelTerbuka === null) return;
    setSavingJenis(true);
    setJenisError(null);
    try {
      if (editingJenis) {
        await api.put(`/jenis-assessment/${editingJenis.id}`, {
          nama: jenisForm.nama,
          kategori: jenisForm.kategori,
          bobot: Number(jenisForm.bobot),
        });
      } else {
        await api.post("/jenis-assessment", {
          mapel_plus_id: mapelTerbuka,
          nama: jenisForm.nama,
          kategori: jenisForm.kategori,
          bobot: Number(jenisForm.bobot),
        });
      }
      tutupJenisModal();
      await load();
      muatJenis(mapelTerbuka);
    } catch (err: unknown) {
      const pesan = (err as { response?: { data?: { message?: string } } })?.response?.data;
      setJenisError(pesan?.message ?? "Gagal menyimpan jenis assessment.");
    } finally {
      setSavingJenis(false);
    }
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
        action={<Button onClick={bukaTambahMapel}>+ Tambah Mapel</Button>}
      />

      {hapusError && (
        <div className="mb-6">
          <Alert variant="danger" onClose={() => setHapusError(null)}>{hapusError}</Alert>
        </div>
      )}

      <Modal
        open={mapelModal}
        onClose={tutupMapelModal}
        title={editingMapel ? `Edit Mapel: ${editingMapel.nama}` : "Tambah Mata Pelajaran Plus"}
        description="Mapel plus adalah mata pelajaran kepesantrenan di luar mapel umum."
        maxWidth="sm"
      >
        <form onSubmit={handleMapelSubmit} className="flex flex-col gap-4">
          <Input
            label="Kode"
            value={mapelForm.kode}
            onChange={(e) => setMapelForm({ ...mapelForm, kode: e.target.value.toUpperCase() })}
            placeholder="TAHFIDZ"
            required
            disabled={!!editingMapel}
            hint={editingMapel ? "Kode tidak dapat diubah" : undefined}
          />
          <Input
            label="Nama Mapel"
            value={mapelForm.nama}
            onChange={(e) => setMapelForm({ ...mapelForm, nama: e.target.value })}
            placeholder="Tahfidz Al-Quran"
            required
          />
          <label className="flex items-center gap-2.5 text-sm text-slate-700 cursor-pointer pt-1">
            <input
              type="checkbox"
              checked={mapelForm.punya_progres_hafalan}
              onChange={(e) => setMapelForm({ ...mapelForm, punya_progres_hafalan: e.target.checked })}
              className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
            />
            Punya tracker hafalan
          </label>
          {mapelError && <p className="text-sm text-red-600">{mapelError}</p>}
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="outline" onClick={tutupMapelModal}>Batal</Button>
            <Button type="submit" loading={savingMapel}>
              {editingMapel ? "Simpan Perubahan" : "Simpan Mapel"}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={jenisModal}
        onClose={tutupJenisModal}
        title={editingJenis ? `Edit: ${editingJenis.nama}` : "Tambah Jenis Assessment"}
        description="Sumatif dihitung dengan bobotnya; formatif hanya sebagai umpan balik proses."
        maxWidth="sm"
      >
        <form onSubmit={handleJenisSubmit} className="flex flex-col gap-4">
          <Input
            label="Nama Jenis Assessment"
            value={jenisForm.nama}
            onChange={(e) => setJenisForm({ ...jenisForm, nama: e.target.value })}
            placeholder="contoh: Ujian Tengah Semester"
            required
          />
          <Select
            label="Kategori"
            value={jenisForm.kategori}
            onChange={(e) => setJenisForm({ ...jenisForm, kategori: e.target.value })}
          >
            <option value="sumatif">Sumatif (dihitung)</option>
            <option value="formatif">Formatif (proses)</option>
          </Select>
          <Input
            label="Bobot (%)"
            type="number"
            min={0}
            max={100}
            value={jenisForm.bobot}
            onChange={(e) => setJenisForm({ ...jenisForm, bobot: e.target.value })}
            required
            hint="Khusus sumatif — total bobot sumatif tiap mapel idealnya 100%"
          />
          {jenisError && <p className="text-sm text-red-600">{jenisError}</p>}
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="outline" onClick={tutupJenisModal}>Batal</Button>
            <Button type="submit" loading={savingJenis}>
              {editingJenis ? "Simpan Perubahan" : "Simpan Jenis"}
            </Button>
          </div>
        </form>
      </Modal>

      {loading ? (
        <Skeleton className="h-40 w-full" />
      ) : data.length === 0 ? (
        <EmptyState
          title="Belum ada mapel plus"
          description="Tambahkan mata pelajaran kepesantrenan baru."
          action={<Button onClick={bukaTambahMapel}>+ Tambah Mapel</Button>}
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
                    className="flex flex-wrap items-center gap-3 text-left cursor-pointer min-w-0"
                  >
                    <span className="font-mono text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-2.5 py-0.5 shrink-0">
                      {m.kode}
                    </span>
                    <span className="font-medium text-slate-800">{m.nama}</span>
                    {m.punya_progres_hafalan && <Badge variant="success">Hafalan</Badge>}
                    <Badge variant="default">{m.jenis_assessments_count} assessment</Badge>
                  </button>
                  <div className="flex items-center gap-1 shrink-0">
                    <IconButton icon="edit" variant="edit" label="Edit mapel" onClick={() => mulaiEditMapel(m)} />
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
                          <Button size="sm" variant="outline" onClick={bukaTambahJenis}>+ Tambah Jenis</Button>
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
                                        <IconButton icon="edit" variant="edit" label="Edit jenis assessment" onClick={() => mulaiEditJenis(j)} />
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