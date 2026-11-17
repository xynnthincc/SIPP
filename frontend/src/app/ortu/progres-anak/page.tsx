"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { labelKelas } from "@/lib/kelas";
import { PageHeader, Card, Select, Badge, Skeleton, Button } from "@/components/ui";

interface Anak {
  id: number;
  nis: string;
  nama: string;
  kelas_rombel: { nama: string } | null;
}

interface SemesterLite {
  id: number;
  nama: string;
  jenis: "Akhir" | "Sementara";
  is_aktif: boolean;
  tahun_ajaran: { nama: string } | null;
}

interface ProgresHafalan {
  id: number;
  tanggal_setoran: string;
  materi: string;
  status: string;
  mapel_plus: { nama: string };
}

interface CatatanGuru {
  id: number;
  tanggal: string;
  catatan: string;
}

interface Presensi {
  id: number;
  tanggal: string;
  status: string;
}

const STATUS_VARIANT: Record<string, "success" | "warning" | "danger" | "info" | "default"> = {
  Hadir: "success",
  Sakit: "warning",
  Izin: "info",
  Alpa: "danger",
};

const HAFALAN_VARIANT: Record<string, "success" | "warning" | "danger"> = {
  Lancar: "success",
  "Perlu Perbaikan": "warning",
  Mengulang: "danger",
};

export default function ProgresAnakPage() {
  const [anakList, setAnakList] = useState<Anak[]>([]);
  const [anakId, setAnakId] = useState<number | null>(null);
  const [progres, setProgres] = useState<ProgresHafalan[]>([]);
  const [catatan, setCatatan] = useState<CatatanGuru[]>([]);
  const [presensi, setPresensi] = useState<Presensi[]>([]);
  const [loading, setLoading] = useState(true);
  const [semesterAktif, setSemesterAktif] = useState<SemesterLite | null>(null);

  useEffect(() => {
    api.get<SemesterLite[]>("/semester").then((res) => {
      setSemesterAktif(res.data.find((s) => s.is_aktif) ?? res.data[0] ?? null);
    }).catch(() => setSemesterAktif(null));
  }, []);

  useEffect(() => {
    api.get<Anak[]>("/siswa").then((res) => {
      setAnakList(res.data);
      if (res.data.length > 0) setAnakId(res.data[0].id);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!anakId) return;
    Promise.all([
      api.get<ProgresHafalan[]>("/progres-hafalan", { params: { siswa_id: anakId } }),
      api.get<CatatanGuru[]>("/catatan-guru", { params: { siswa_id: anakId } }),
      api.get<Presensi[]>("/presensi", { params: { siswa_id: anakId } }),
    ]).then(([p, c, pr]) => {
      setProgres(p.data);
      setCatatan(c.data);
      setPresensi(pr.data);
      setLoading(false);
    });
  }, [anakId]);

  return (
    <div className="animate-fade-in">
      <PageHeader title="Progres Anak" description="Pantau perkembangan hafalan, catatan guru, dan presensi anak." />

      {anakList.length > 1 && (
        <Card className="mb-6">
          <Select label="Pilih Anak" value={anakId ?? ""} onChange={(e) => { setAnakId(Number(e.target.value)); setLoading(true); }}>
            {anakList.map((a) => (
              <option key={a.id} value={a.id}>{a.nama} - {labelKelas(a.kelas_rombel?.nama) ?? "-"}</option>
            ))}
          </Select>
        </Card>
      )}

      {loading ? (
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
          <Card>
            <h3 className="text-sm font-semibold text-slate-700 mb-3">Progres Hafalan</h3>
            <div className="space-y-2">
              {progres.length === 0 ? (
                <p className="text-sm text-slate-400">Belum ada catatan.</p>
              ) : progres.map((p) => (
                <div key={p.id} className="p-3 rounded-xl bg-slate-50/50">
                  <div className="flex items-start justify-between">
                    <p className="text-sm font-medium text-slate-800">{p.mapel_plus.nama}</p>
                    <Badge variant={HAFALAN_VARIANT[p.status] || "default"}>{p.status}</Badge>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">{p.materi}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{p.tanggal_setoran}</p>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <h3 className="text-sm font-semibold text-slate-700 mb-3">Catatan Guru</h3>
            <div className="space-y-2">
              {catatan.length === 0 ? (
                <p className="text-sm text-slate-400">Belum ada catatan.</p>
              ) : catatan.map((c) => (
                <div key={c.id} className="p-3 rounded-xl bg-slate-50/50">
                  <p className="text-sm text-slate-700">{c.catatan}</p>
                  <p className="text-xs text-slate-400 mt-1">{c.tanggal}</p>
                </div>
              ))}
            </div>
          </Card>

          <Card className="md:col-span-2">
            <h3 className="text-sm font-semibold text-slate-700 mb-3">Presensi Terbaru</h3>
            <div className="flex flex-wrap gap-2">
              {presensi.length === 0 ? (
                <p className="text-sm text-slate-400">Belum ada data presensi.</p>
              ) : presensi.slice(0, 20).map((p) => (
                <Badge key={p.id} variant={STATUS_VARIANT[p.status] || "default"}>
                  {p.tanggal} - {p.status}
                </Badge>
              ))}
            </div>
          </Card>

          <Card className="md:col-span-2">
            <h3 className="text-sm font-semibold text-slate-700 mb-3">Rapor Anak</h3>
            {semesterAktif ? (
              <div className="space-y-2">
                <p className="text-xs text-slate-400">
                  Rapor direal-time dari data nilai — Semester {semesterAktif.nama}{semesterAktif.jenis === "Sementara" && " (Sementara)"} {semesterAktif.tahun_ajaran?.nama ?? ""}
                </p>
                {anakList.map((a) => (
                  <div key={a.id} className="flex items-center justify-between gap-3 p-3 rounded-xl bg-slate-50/50">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate">{a.nama}</p>
                      <p className="text-xs text-slate-400">
                        NIS {a.nis} • {labelKelas(a.kelas_rombel?.nama) ?? "-"}
                      </p>
                    </div>
                    <Link href={`/rapor-cetak?siswa_id=${a.id}&semester_id=${semesterAktif.id}`} className="shrink-0">
                      <Button size="sm" variant="outline">Lihat &amp; Cetak</Button>
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-400">Belum ada semester aktif.</p>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
