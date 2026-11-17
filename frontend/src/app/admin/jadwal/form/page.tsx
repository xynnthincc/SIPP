"use client";

import { Suspense, useCallback, useEffect, useMemo, useState, FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { labelKelas } from "@/lib/kelas";
import { labelSemester } from "@/lib/semester";
import { PageHeader, Card, Button, Select, Input, Skeleton, Alert } from "@/components/ui";

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

interface GuruLite {
  id: number;
  nama: string;
}

interface MapelLite {
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
  guru_mapel_kelas_id: number;
  guru_mapel_kelas: Pengampu;
}

function JadwalPengampuForm() {
  const router = useRouter();
  const params = useSearchParams();
  const jenis = params.get("jenis") === "pengampu" ? "pengampu" : "jadwal";
  const idParam = params.get("id");
  const kelasParam = params.get("kelas") ?? "";
  const semesterParam = params.get("semester") ?? "";
  const isEdit = !!idParam;

  const [semesters, setSemesters] = useState<SemesterLite[]>([]);
  const [kelasList, setKelasList] = useState<KelasLite[]>([]);
  const [guruList, setGuruList] = useState<GuruLite[]>([]);
  const [mapelList, setMapelList] = useState<MapelLite[]>([]);
  const [pengampuList, setPengampuList] = useState<Pengampu[]>([]);

  const [formJadwal, setFormJadwal] = useState({ pengampuId: "", hari: "Senin", jam_mulai: "", jam_selesai: "", ruangan: "" });
  const [formPengampu, setFormPengampu] = useState({ guru_id: "", mapel_plus_id: "", kelas_rombel_id: "", semester_id: "" });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Data dasar untuk kedua mode
  useEffect(() => {
    const permintaan: Promise<unknown>[] = [
      api.get<SemesterLite[]>("/semester"),
      api.get<KelasLite[]>("/kelas-rombel"),
    ];
    if (jenis === "pengampu") {
      permintaan.push(api.get<GuruLite[]>("/guru"), api.get<MapelLite[]>("/mapel-plus"));
    }
    Promise.all(permintaan)
      .then(([sem, kls, gr, mpl]) => {
        setSemesters((sem as { data: SemesterLite[] }).data);
        setKelasList((kls as { data: KelasLite[] }).data);
        if (gr && mpl) {
          setGuruList((gr as { data: GuruLite[] }).data);
          setMapelList((mpl as { data: MapelLite[] }).data);
        }
      })
      .catch(() => setError("Gagal memuat data dasar."));
  }, [jenis]);

  // Mode pengampu: daftar penugasan semester terpilih (untuk menemukan data edit)
  const muatPengampu = useCallback((semesterId: string) => {
    if (!semesterId) return Promise.resolve([]);
    return api
      .get<Pengampu[]>("/guru-mapel-kelas", { params: { semester_id: semesterId } })
      .then((res) => res.data)
      .catch(() => [] as Pengampu[]);
  }, []);

  // Inisialisasi form sesuai mode
  useEffect(() => {
    if (semesters.length === 0) return;
    let aktif = true;

    async function init() {
      try {
        if (jenis === "pengampu") {
          const semesterAwal = semesterParam || String(semesters.find((s) => s.id === Number(semesterParam))?.id ?? semesters[0]?.id ?? "");
          if (isEdit) {
            const daftar = await muatPengampu(semesterAwal);
            const item = daftar.find((p) => String(p.id) === idParam);
            if (!aktif) return;
            if (item) {
              setFormPengampu({
                guru_id: String(item.guru.id),
                mapel_plus_id: String(item.mapel_plus.id),
                kelas_rombel_id: String(item.kelas_rombel.id),
                semester_id: String(item.semester.id),
              });
            }
          } else if (aktif) {
            setFormPengampu((f) => ({
              ...f,
              semester_id: semesterAwal,
              kelas_rombel_id: f.kelas_rombel_id || kelasParam,
            }));
          }
        } else if (isEdit) {
          // Mode edit jadwal: ambil daftar jadwal kelas terkait lalu cari itemnya
          if (!kelasParam) {
            setError("Konteks kelas tidak ditemukan. Buka ulang dari menu Jadwal & Pengampu.");
            setLoading(false);
            return;
          }
          const [daftarJadwal, daftarPengampu] = await Promise.all([
            api.get<JadwalItem[]>("/jadwal", { params: { kelas_rombel_id: kelasParam } }).then((r) => r.data).catch(() => [] as JadwalItem[]),
            muatPengampu(semesterParam),
          ]);
          if (!aktif) return;
          const item = daftarJadwal.find((j) => String(j.id) === idParam);
          if (item) {
            setFormJadwal({
              pengampuId: String(item.guru_mapel_kelas_id),
              hari: item.hari,
              jam_mulai: item.jam_mulai,
              jam_selesai: item.jam_selesai,
              ruangan: item.ruangan ?? "",
            });
            setPengampuList(daftarPengampu);
          } else {
            setError("Jadwal tidak ditemukan. Mungkin sudah dihapus.");
          }
        } else if (aktif) {
          // Mode tambah jadwal: pengampu kelas terpilih pada semester aktif/terkirim
          const semesterAwal = semesterParam || String(semesters.find((s) => s.id === Number(semesterParam))?.id ?? "");
          const daftar = await muatPengampu(semesterAwal);
          if (!aktif) return;
          setPengampuList(daftar);
        }
      } finally {
        if (aktif) setLoading(false);
      }
    }

    init();
    return () => {
      aktif = false;
    };
  }, [semesters, jenis, isEdit, idParam, kelasParam, semesterParam, muatPengampu]);

  // Mode tambah jadwal: pengampu untuk kelas yang dipilih di form
  const [kelasForm, setKelasForm] = useState(kelasParam);
  useEffect(() => {
    if (jenis !== "jadwal" || isEdit) return;
    const semesterAwal = semesterParam || String(semesters.find((s) => s.id === Number(semesterParam))?.id ?? "");
    muatPengampu(semesterAwal).then((daftar) => setPengampuList(daftar));
  }, [kelasForm, jenis, isEdit, semesterParam, semesters, muatPengampu]);

  const pengampuKelasIni = useMemo(
    () => pengampuList.filter((p) => String(p.kelas_rombel.id) === kelasForm),
    [pengampuList, kelasForm]
  );

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      if (jenis === "pengampu") {
        const payload = {
          guru_id: Number(formPengampu.guru_id),
          mapel_plus_id: Number(formPengampu.mapel_plus_id),
          kelas_rombel_id: Number(formPengampu.kelas_rombel_id),
          semester_id: Number(formPengampu.semester_id),
        };
        if (isEdit) {
          await api.put(`/guru-mapel-kelas/${idParam}`, payload);
        } else {
          await api.post("/guru-mapel-kelas", payload);
        }
      } else {
        const payload = {
          guru_mapel_kelas_id: Number(formJadwal.pengampuId),
          hari: formJadwal.hari,
          jam_mulai: formJadwal.jam_mulai,
          jam_selesai: formJadwal.jam_selesai,
          ruangan: formJadwal.ruangan || null,
        };
        if (isEdit) {
          await api.put(`/jadwal/${idParam}`, payload);
        } else {
          await api.post("/jadwal", payload);
        }
      }
      router.push("/admin/jadwal");
    } catch (err: unknown) {
      const pesan = (err as { response?: { data?: { message?: string } } })?.response?.data;
      setError(pesan?.message ?? "Gagal menyimpan.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <Skeleton className="h-64 w-full" />;
  }

  const judul =
    jenis === "pengampu"
      ? isEdit ? "Edit Pengampu" : "Tambah Pengampu"
      : isEdit ? "Edit Jadwal" : "Tambah Jadwal";

  const deskripsi =
    jenis === "pengampu"
      ? "Tugaskan guru untuk mengampu mapel di kelas pada semester tertentu."
      : "Susun sesi mengajar: pengampu, hari, jam, dan ruangan.";

  return (
    <div className="animate-fade-in">
      <PageHeader title={judul} description={deskripsi} />

      {error && (
        <div className="mb-6">
          <Alert variant="danger" onClose={() => setError(null)}>{error}</Alert>
        </div>
      )}

      <Card>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {jenis === "pengampu" ? (
            <>
              <Select
                label="Semester"
                value={formPengampu.semester_id}
                onChange={(e) => setFormPengampu({ ...formPengampu, semester_id: e.target.value })}
                placeholder="Pilih semester"
                required
                disabled={isEdit}
              >
                {semesters.map((s) => (
                  <option key={s.id} value={s.id}>
                    {labelSemester(s)}
                  </option>
                ))}
              </Select>
              <Select
                label="Guru"
                value={formPengampu.guru_id}
                onChange={(e) => setFormPengampu({ ...formPengampu, guru_id: e.target.value })}
                placeholder="Pilih guru"
                required
              >
                {guruList.map((g) => (
                  <option key={g.id} value={g.id}>{g.nama}</option>
                ))}
              </Select>
              <Select
                label="Mata Pelajaran"
                value={formPengampu.mapel_plus_id}
                onChange={(e) => setFormPengampu({ ...formPengampu, mapel_plus_id: e.target.value })}
                placeholder="Pilih mapel"
                required
              >
                {mapelList.map((m) => (
                  <option key={m.id} value={m.id}>{m.nama}</option>
                ))}
              </Select>
              <Select
                label="Kelas"
                value={formPengampu.kelas_rombel_id}
                onChange={(e) => setFormPengampu({ ...formPengampu, kelas_rombel_id: e.target.value })}
                placeholder="Pilih kelas"
                required
              >
                {kelasList.map((k) => (
                  <option key={k.id} value={k.id}>{labelKelas(k.nama) ?? k.nama}</option>
                ))}
              </Select>
            </>
          ) : (
            <>
              <div className="sm:col-span-2">
                <Select
                  label="Kelas"
                  value={kelasForm}
                  onChange={(e) => {
                    setKelasForm(e.target.value);
                    setFormJadwal({ ...formJadwal, pengampuId: "" });
                  }}
                  placeholder="Pilih kelas"
                  required
                  disabled={isEdit}
                >
                  {kelasList.map((k) => (
                    <option key={k.id} value={k.id}>{labelKelas(k.nama) ?? k.nama}</option>
                  ))}
                </Select>
              </div>
              <div className="sm:col-span-2">
                <Select
                  label="Pengampu (Mapel · Guru)"
                  value={formJadwal.pengampuId}
                  onChange={(e) => setFormJadwal({ ...formJadwal, pengampuId: e.target.value })}
                  placeholder={pengampuKelasIni.length === 0 ? "Belum ada pengampu di kelas ini" : "Pilih pengampu"}
                  required
                  disabled={pengampuKelasIni.length === 0}
                >
                  {pengampuKelasIni.map((p) => (
                    <option key={p.id} value={p.id}>{`${p.mapel_plus.nama} · ${p.guru.nama}`}</option>
                  ))}
                </Select>
              </div>
              <Select
                label="Hari"
                value={formJadwal.hari}
                onChange={(e) => setFormJadwal({ ...formJadwal, hari: e.target.value })}
                required
              >
                {HARI.map((h) => (
                  <option key={h} value={h}>{h}</option>
                ))}
              </Select>
              <Input
                label="Ruangan (opsional)"
                value={formJadwal.ruangan}
                onChange={(e) => setFormJadwal({ ...formJadwal, ruangan: e.target.value })}
                placeholder="contoh: Aula Pesantren"
              />
              <Input
                label="Jam Mulai"
                type="time"
                value={formJadwal.jam_mulai}
                onChange={(e) => setFormJadwal({ ...formJadwal, jam_mulai: e.target.value })}
                required
              />
              <Input
                label="Jam Selesai"
                type="time"
                value={formJadwal.jam_selesai}
                onChange={(e) => setFormJadwal({ ...formJadwal, jam_selesai: e.target.value })}
                required
              />
            </>
          )}

          <div className="sm:col-span-2 flex justify-end gap-3 mt-2">
            <Link href="/admin/jadwal">
              <Button type="button" variant="outline">Batal</Button>
            </Link>
            <Button type="submit" loading={saving}>
              {isEdit ? "Simpan Perubahan" : "Simpan"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

export default function JadwalFormPage() {
  return (
    <Suspense fallback={<Skeleton className="h-64 w-full" />}>
      <JadwalPengampuForm />
    </Suspense>
  );
}
