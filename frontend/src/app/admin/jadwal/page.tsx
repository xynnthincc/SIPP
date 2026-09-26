"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { labelKelas } from "@/lib/kelas";
import { labelSemester } from "@/lib/semester";
import {
  PageHeader, Card, Button, Badge, Select, Skeleton, EmptyState,
  ConfirmModal, IconButton, Alert,
} from "@/components/ui";

const HARI = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"] as const;

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
            a.guru.nama.localeCompare(b.guru.nama) ||
            a.kelas_rombel.nama.localeCompare(b.kelas_rombel.nama) ||
            a.mapel_plus.nama.localeCompare(b.mapel_plus.nama)
        ),
    [pengampuList]
  );

  // Group by guru — satu guru dengan banyak mapel/kelas ditampilkan sekali,
  // dengan daftar penugasan sebagai badge di dalam kartunya.
  const pengampuPerGuru = useMemo(() => {
    const map = new Map<number, { guru: { id: number; nama: string }; items: Pengampu[] }>();
    pengampuTerurut.forEach((p) => {
      const g = map.get(p.guru.id);
      if (g) {
        g.items.push(p);
      } else {
        map.set(p.guru.id, { guru: p.guru, items: [p] });
      }
    });
    return [...map.values()];
  }, [pengampuTerurut]);

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
              onChange={(e) => { setSemesterId(e.target.value); }}
              placeholder="Pilih semester"
              disabled={semesters.length === 0}
            >
              {semesters.map((s) => (
                <option key={s.id} value={s.id}>
                  {labelSemester(s)}
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

      {/* Penugasan pengampu — dikelompokkan per guru */}
      <div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-sm font-semibold text-slate-800">Penugasan Pengampu</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Tiap guru ditampilkan sekali dengan daftar mapel &amp; kelas yang diampu pada semester terpilih.
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

        {!semesterId ? (
          <EmptyState title="Pilih semester" description="Pilih semester untuk melihat penugasan pengampu." />
        ) : pengampuPerGuru.length === 0 ? (
          <EmptyState title="Belum ada pengampu" description="Belum ada penugasan pengampu pada semester ini. Tambahkan penugasan untuk mulai menyusun jadwal." />
        ) : (
          <div className="space-y-3">
            {pengampuPerGuru.map(({ guru, items }) => (
              <Card key={guru.id} className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 rounded-full bg-emerald-500/10 text-emerald-700 flex items-center justify-center text-sm font-semibold shrink-0">
                    {guru.nama.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">{guru.nama}</p>
                    <p className="text-xs text-slate-400">{items.length} penugasan</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {items.map((p) => (
                    <div
                      key={p.id}
                      className="group inline-flex items-center gap-2 pl-3 pr-1 py-1.5 rounded-xl bg-slate-50 border border-slate-200 hover:border-emerald-300 transition-colors"
                    >
                      <span className="text-xs font-medium text-slate-700">{p.mapel_plus.nama}</span>
                      <span className="text-xs text-slate-400">·</span>
                      <span className="text-xs text-slate-500">{labelKelas(p.kelas_rombel.nama) ?? p.kelas_rombel.nama}</span>
                      <button
                        onClick={() => router.push(`/admin/jadwal/form?jenis=pengampu&id=${p.id}&semester=${semesterId}`)}
                        className="ml-1 p-1 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors cursor-pointer"
                        title="Edit pengampu"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => setHapus({
                          jenis: "pengampu",
                          id: p.id,
                          pesan: `Hapus penugasan "${p.mapel_plus.nama}" di ${labelKelas(p.kelas_rombel.nama) ?? p.kelas_rombel.nama} dari ${guru.nama}?`,
                        })}
                        className="p-1 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                        title="Hapus pengampu"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

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
