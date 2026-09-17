"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { labelKelas } from "@/lib/kelas";
import {
  PageHeader, Card, Button, Badge, Select, Skeleton, EmptyState,
  ConfirmModal, IconButton, Alert, Pagination,
  Table, TableHead, TableBody, Th, Td, TableRow,
} from "@/components/ui";

const HARI = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"] as const;
const PER_HALAMAN_PENGAMPU = 10;

interface SemesterLite {
  id: number;
  nama: string;
  tahun_ajaran: { nama: string } | null;
}

interface KelasLite {
  id: number;
  nama: string;
}

interface Pengampu {
  id: number;
  guru: { id: number; nama: string };
  mapel_plus: { id: number; nama: string };
  kelas_rombel: { id: number; nama: string };
  semester: { id: number; nama: string };
}

interface JadwalItem {
  id: number;
  hari: string;
  jam_mulai: string;
  jam_selesai: string;
  ruangan: string | null;
  guru_mapel_kelas: Pengampu;
}

export default function JadwalAdminPage() {
  const router = useRouter();
  const [semesters, setSemesters] = useState<SemesterLite[]>([]);
  const [kelasList, setKelasList] = useState<KelasLite[]>([]);
  const [pengampuList, setPengampuList] = useState<Pengampu[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [semesterId, setSemesterId] = useState("");
  const [kelasId, setKelasId] = useState("");
  const [halamanPengampu, setHalamanPengampu] = useState(1);

  const [jadwalState, setJadwalState] = useState<{ kelas: string; items: JadwalItem[] } | null>(null);
  const loadingJadwal = jadwalState === null || jadwalState.kelas !== kelasId;
  const jadwal = useMemo(
    () => (jadwalState?.kelas === kelasId ? jadwalState.items : []),
    [jadwalState, kelasId]
  );

  const [hapus, setHapus] = useState<{ jenis: "jadwal" | "pengampu"; id: number; pesan: string } | null>(null);
  const [hapusLoading, setHapusLoading] = useState(false);
  const [hapusError, setHapusError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      api.get<SemesterLite[]>("/semester"),
      api.get<KelasLite[]>("/kelas-rombel"),
    ]).then(([sem, kls]) => {
      setSemesters(sem.data);
      const aktif = sem.data.find((s) => s.id === Number(semesterId)) ?? sem.data.find((s) => s.tahun_ajaran);
      if (!semesterId && aktif) setSemesterId(String(aktif.id));
      setKelasList(kls.data);
    }).catch(() => setError("Gagal memuat data semester/kelas."));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadPengampu = useCallback(() => {
    if (!semesterId) return;
    api.get<Pengampu[]>("/guru-mapel-kelas", { params: { semester_id: semesterId } })
      .then((res) => setPengampuList(res.data))
      .catch(() => setPengampuList([]));
  }, [semesterId]);

  const loadJadwal = useCallback(() => {
    if (!kelasId) return;
    api.get<JadwalItem[]>("/jadwal", { params: { kelas_rombel_id: kelasId } })
      .then((res) => setJadwalState({ kelas: kelasId, items: res.data }))
      .catch(() => setJadwalState({ kelas: kelasId, items: [] }));
  }, [kelasId]);

  useEffect(() => { loadPengampu(); }, [loadPengampu]);
  useEffect(() => { loadJadwal(); }, [loadJadwal]);

  const pengampuKelasIni = useMemo(
    () => pengampuList.filter((p) => String(p.kelas_rombel.id) === kelasId),
    [pengampuList, kelasId]
  );

  const jadwalPerHari = useMemo(() => {
    return HARI.map((h) => ({
      hari: h,
      sesi: jadwal
        .filter((j) => j.hari === h)
        .sort((a, b) => a.jam_mulai.localeCompare(b.jam_mulai)),
    }));
  }, [jadwal]);

  const pengampuTerurut = useMemo(
    () =>
      pengampuList
        .slice()
        .sort(
          (a, b) =>
            a.kelas_rombel.nama.localeCompare(b.kelas_rombel.nama) ||
            a.mapel_plus.nama.localeCompare(b.mapel_plus.nama)
        ),
    [pengampuList]
  );

  const halamanPengampuTerakhir = Math.max(1, Math.ceil(pengampuTerurut.length / PER_HALAMAN_PENGAMPU));
  const halamanPengampuAman = Math.min(halamanPengampu, halamanPengampuTerakhir);
  const pengampuTampil = pengampuTerurut.slice(
    (halamanPengampuAman - 1) * PER_HALAMAN_PENGAMPU,
    halamanPengampuAman * PER_HALAMAN_PENGAMPU
  );

  async function handleHapus() {
    if (!hapus) return;
    setHapusLoading(true);
    setHapusError(null);
    try {
      if (hapus.jenis === "jadwal") {
        await api.delete(`/jadwal/${hapus.id}`);
        await loadJadwal();
      } else {
        await api.delete(`/guru-mapel-kelas/${hapus.id}`);
        await loadPengampu();
        await loadJadwal();
      }
      setHapus(null);
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
        title="Jadwal & Pengampu"
        description="Atur penugasan guru pengampu mapel per kelas, lalu susun jadwal mengajarnya."
      />

      {(error || hapusError) && (
        <div className="mb-6 space-y-3">
          {error && <Alert variant="danger" onClose={() => setError(null)}>{error}</Alert>}
          {hapusError && <Alert variant="danger" onClose={() => setHapusError(null)}>{hapusError}</Alert>}
        </div>
      )}

      {/* Filter */}
      <Card className="mb-5 sm:mb-6">
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <div className="flex-1">
            <Select
              label="Semester"
              value={semesterId}
              onChange={(e) => { setSemesterId(e.target.value); setHalamanPengampu(1); }}
              placeholder="Pilih semester"
              disabled={semesters.length === 0}
            >
              {semesters.map((s) => (
                <option key={s.id} value={s.id}>
                  {`Semester ${s.nama} ${s.tahun_ajaran?.nama ?? ""}`.trim()}
                </option>
              ))}
            </Select>
          </div>
          <div className="flex-1">
            <Select
              label="Kelas"
              value={kelasId}
              onChange={(e) => setKelasId(e.target.value)}
              placeholder="Pilih kelas"
              disabled={kelasList.length === 0}
            >
              {kelasList.map((k) => (
                <option key={k.id} value={k.id}>{labelKelas(k.nama) ?? k.nama}</option>
              ))}
            </Select>
          </div>
          <div className="flex items-end gap-3">
            <Button
              onClick={() => router.push(`/admin/jadwal/form?jenis=jadwal&kelas=${kelasId}&semester=${semesterId}`)}
              disabled={!kelasId || pengampuKelasIni.length === 0}
              title={!kelasId ? "Pilih kelas dulu" : pengampuKelasIni.length === 0 ? "Belum ada pengampu di kelas ini" : undefined}
            >
              + Tambah Jadwal
            </Button>
          </div>
        </div>
      </Card>

      {/* Grid jadwal per hari */}
      <div className="mb-5 sm:mb-6">
        {!kelasId ? (
          <EmptyState title="Pilih kelas" description="Pilih semester dan kelas untuk melihat serta menyusun jadwal." />
        ) : loadingJadwal ? (
          <Skeleton className="h-64 w-full" />
        ) : jadwal.length === 0 ? (
          <EmptyState
            title="Belum ada jadwal"
            description={pengampuKelasIni.length === 0
              ? "Kelas ini belum memiliki pengampu. Tambahkan penugasan pengampu terlebih dahulu di bawah."
              : "Tambahkan sesi mengajar baru melalui tombol Tambah Jadwal."}
          />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {jadwalPerHari.filter((h) => h.sesi.length > 0).map(({ hari, sesi }) => (
              <Card key={hari}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-slate-800">{hari}</span>
                    <Badge variant="default">{sesi.length} sesi</Badge>
                  </div>
                </div>
                <div className="divide-y divide-slate-100">
                  {sesi.map((j) => (
                    <div key={j.id} className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-800 truncate">
                          {j.guru_mapel_kelas.mapel_plus.nama}
                        </p>
                        <p className="text-xs text-slate-400 truncate">
                          {j.guru_mapel_kelas.guru.nama}{j.ruangan ? ` • ${j.ruangan}` : ""}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs font-medium text-slate-600 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-100 whitespace-nowrap">
                          {j.jam_mulai}-{j.jam_selesai}
                        </span>
                        <IconButton
                          icon="edit"
                          variant="edit"
                          label="Edit jadwal"
                          onClick={() => router.push(`/admin/jadwal/form?jenis=jadwal&id=${j.id}&kelas=${kelasId}&semester=${semesterId}`)}
                        />
                        <IconButton
                          icon="trash"
                          variant="delete"
                          label="Hapus jadwal"
                          onClick={() => setHapus({
                            jenis: "jadwal",
                            id: j.id,
                            pesan: `Yakin ingin menghapus jadwal "${j.guru_mapel_kelas.mapel_plus.nama}" pada ${hari} pukul ${j.jam_mulai}-${j.jam_selesai}?`,
                          })}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Penugasan pengampu */}
      <Card className="p-0">
        <div className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-200/70">
          <div>
            <h3 className="text-sm font-semibold text-slate-800">Penugasan Pengampu</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Guru yang ditugaskan mengampu mapel di kelas tertentu pada semester terpilih — prasyarat sebelum membuat jadwal.
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => router.push(`/admin/jadwal/form?jenis=pengampu&semester=${semesterId}&kelas=${kelasId}`)}
            disabled={!semesterId}
          >
            + Tambah Pengampu
          </Button>
        </div>

        {pengampuList.length === 0 ? (
          <p className="text-sm text-slate-400 py-8 text-center">
            Belum ada penugasan pengampu pada semester ini.
          </p>
        ) : (
          <>
            <Table>
              <TableHead>
                <Th className="w-12">No</Th>
                <Th>Guru</Th>
                <Th>Mata Pelajaran</Th>
                <Th>Kelas</Th>
                <Th className="text-right">Aksi</Th>
              </TableHead>
              <TableBody>
                {pengampuTampil.map((p, i) => (
                  <TableRow key={p.id}>
                    <Td className="text-slate-400 font-mono text-xs">
                      {(halamanPengampuAman - 1) * PER_HALAMAN_PENGAMPU + i + 1}
                    </Td>
                    <Td>
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-emerald-500/10 text-emerald-700 flex items-center justify-center text-sm font-semibold shrink-0">
                          {p.guru.nama.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium text-slate-800">{p.guru.nama}</span>
                      </div>
                    </Td>
                    <Td>
                      <span className="font-medium text-slate-700">{p.mapel_plus.nama}</span>
                    </Td>
                    <Td>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
                        {labelKelas(p.kelas_rombel.nama) ?? p.kelas_rombel.nama}
                      </span>
                    </Td>
                    <Td className="whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        <IconButton
                          icon="edit"
                          variant="edit"
                          label="Edit pengampu"
                          onClick={() => router.push(`/admin/jadwal/form?jenis=pengampu&id=${p.id}&semester=${semesterId}`)}
                        />
                        <IconButton
                          icon="trash"
                          variant="delete"
                          label="Hapus pengampu"
                          onClick={() => setHapus({
                            jenis: "pengampu",
                            id: p.id,
                            pesan: `Yakin ingin menghapus penugasan "${p.guru.nama}" mengampu "${p.mapel_plus.nama}" di ${labelKelas(p.kelas_rombel.nama) ?? p.kelas_rombel.nama}? Jadwal terkait juga akan hilang dari tampilan guru.`,
                          })}
                        />
                      </div>
                    </Td>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <Pagination
              page={halamanPengampuAman}
              lastPage={halamanPengampuTerakhir}
              total={pengampuTerurut.length}
              from={pengampuTerurut.length === 0 ? 0 : (halamanPengampuAman - 1) * PER_HALAMAN_PENGAMPU + 1}
              to={Math.min(halamanPengampuAman * PER_HALAMAN_PENGAMPU, pengampuTerurut.length)}
              label="pengampu"
              onPageChange={setHalamanPengampu}
            />
          </>
        )}
      </Card>

      <ConfirmModal
        open={hapus !== null}
        onClose={() => setHapus(null)}
        onConfirm={handleHapus}
        loading={hapusLoading}
        title={hapus?.jenis === "jadwal" ? "Hapus Jadwal" : "Hapus Pengampu"}
        message={hapus?.pesan ?? ""}
      />
    </div>
  );
}
