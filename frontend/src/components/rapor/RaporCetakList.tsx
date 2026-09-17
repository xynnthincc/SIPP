"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { labelKelas } from "@/lib/kelas";
import {
  PageHeader, Card, Button, Badge, Select, Skeleton, EmptyState, Pagination,
  Table, TableHead, TableBody, Th, Td, TableRow,
} from "@/components/ui";

const PER_HALAMAN = 10;

interface SemesterLite {
  id: number;
  nama: string;
  is_aktif: boolean;
  tahun_ajaran: { nama: string } | null;
}

interface KelasLite {
  id: number;
  nama: string;
}

interface ProgresSiswa {
  siswa: { id: number; nama: string; nis: string };
  kelas: string | null;
  mapel_terisi: number;
  mapel_total: number;
  praktik_terisi: number;
  praktik_total: number;
  pembiasaan_terisi: boolean;
  sikap_terisi: boolean;
  kehadiran_terisi: boolean;
  lengkap: boolean;
}

function IkonCheck({ ok }: { ok: boolean }) {
  return ok ? (
    <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
    </svg>
  ) : (
    <span className="text-slate-300">–</span>
  );
}

/**
 * Daftar siswa + progres kelengkapan nilai + tombol cetak rapor real-time
 * (mengikuti alur e-rapor lama: tanpa status/validasi).
 * - Wali kelas: kelas terkunci ke kelas binaannya (bolehPilihKelas=false).
 * - Kepala sekolah/admin: bebas memilih kelas (bolehPilihKelas=true).
 */
export default function RaporCetakList({
  bolehPilihKelas,
  judul,
  deskripsi,
}: {
  bolehPilihKelas: boolean;
  judul: string;
  deskripsi: string;
}) {
  const [semesters, setSemesters] = useState<SemesterLite[]>([]);
  const [kelasList, setKelasList] = useState<KelasLite[]>([]);
  const [semesterId, setSemesterId] = useState("");
  const [kelasId, setKelasId] = useState("");
  const [progres, setProgres] = useState<ProgresSiswa[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  useEffect(() => {
    Promise.all([
      api.get<SemesterLite[]>("/semester"),
      api.get<KelasLite[]>("/kelas-rombel"),
    ]).then(([sem, kls]) => {
      setSemesters(sem.data);
      const aktif = sem.data.find((s) => s.is_aktif) ?? sem.data[0];
      if (aktif) setSemesterId(String(aktif.id));
      setKelasList(kls.data);
      if (!bolehPilihKelas && kls.data[0]) setKelasId(String(kls.data[0].id));
    }).catch(() => setError("Gagal memuat data semester/kelas."));
  }, [bolehPilihKelas]);

  const loadProgres = useCallback(() => {
    if (!semesterId) return;
    api.get<ProgresSiswa[]>("/rapor/progres", {
      params: { semester_id: semesterId, kelas_rombel_id: kelasId || undefined },
    }).then((res) => {
      setProgres(res.data);
      setLoading(false);
      setError(null);
    }).catch(() => {
      setProgres([]);
      setLoading(false);
    });
  }, [semesterId, kelasId]);

  useEffect(() => { loadProgres(); }, [loadProgres]);

  const daftar = progres ?? [];
  const jumlahLengkap = daftar.filter((p) => p.lengkap).length;
  const persenLengkap = daftar.length > 0 ? Math.round((jumlahLengkap / daftar.length) * 100) : 0;

  const lastPage = Math.max(1, Math.ceil(daftar.length / PER_HALAMAN));
  const safePage = Math.min(page, lastPage);
  const tampil = daftar.slice((safePage - 1) * PER_HALAMAN, safePage * PER_HALAMAN);

  const semesterDipilih = useMemo(
    () => semesters.find((s) => String(s.id) === semesterId),
    [semesters, semesterId]
  );

  return (
    <div className="animate-fade-in">
      <PageHeader title={judul} description={deskripsi} />

      {error && (
        <div className="mb-6">
          <span className="text-sm text-red-600">{error}</span>
        </div>
      )}

      {/* Ringkasan kesiapan */}
      {!loading && daftar.length > 0 && (
        <div className="mb-5 sm:mb-6">
          <Card>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Kesiapan Rapor</p>
                <p className="text-2xl font-bold text-slate-800 mt-1">
                  {jumlahLengkap}<span className="text-slate-400 font-medium"> / {daftar.length} siswa</span>
                </p>
                <p className="text-xs text-slate-400 mt-0.5">nilai mapel & praktik lengkap — siap dicetak</p>
              </div>
              <div className="w-full sm:w-56">
                <div className="flex justify-between text-xs text-slate-500 mb-1">
                  <span>Progres</span>
                  <span className="font-semibold text-slate-700">{persenLengkap}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div
                    className="bg-emerald-600 h-2 rounded-full transition-all duration-700"
                    style={{ width: `${persenLengkap}%` }}
                  />
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Filter */}
      <Card className="mb-5 sm:mb-6">
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <div className="flex-1">
            <Select
              label="Semester"
              value={semesterId}
              onChange={(e) => { setSemesterId(e.target.value); setPage(1); }}
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
          {bolehPilihKelas && (
            <div className="flex-1">
              <Select
                label="Kelas"
                value={kelasId}
                onChange={(e) => { setKelasId(e.target.value); setPage(1); }}
                placeholder="Semua kelas"
              >
                <option value="">Semua Kelas</option>
                {kelasList.map((k) => (
                  <option key={k.id} value={k.id}>{labelKelas(k.nama) ?? k.nama}</option>
                ))}
              </Select>
            </div>
          )}
        </div>
      </Card>

      {loading ? (
        <Skeleton className="h-64 w-full" />
      ) : !semesterDipilih ? (
        <EmptyState title="Pilih semester" description="Pilih semester untuk melihat kesiapan rapor siswa." />
      ) : daftar.length === 0 ? (
        <EmptyState
          title="Tidak ada siswa"
          description={bolehPilihKelas && !kelasId
            ? "Belum ada siswa pada scope ini."
            : "Kelas ini belum memiliki siswa."}
        />
      ) : (
        <Card className="p-0">
          <Table>
            <TableHead>
              <Th className="w-12">No</Th>
              <Th>Nama Siswa</Th>
              <Th>NIS</Th>
              {bolehPilihKelas && <Th>Kelas</Th>}
              <Th>Nilai Mapel</Th>
              <Th>Praktik</Th>
              <Th className="text-center">Pemb. / Sikap / Hadir</Th>
              <Th className="text-right">Aksi</Th>
            </TableHead>
            <TableBody>
              {tampil.map((p, i) => {
                const persenMapel = p.mapel_total > 0 ? Math.round((p.mapel_terisi / p.mapel_total) * 100) : 0;
                return (
                  <TableRow key={p.siswa.id}>
                    <Td className="text-slate-400">{(safePage - 1) * PER_HALAMAN + i + 1}</Td>
                    <Td>
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-emerald-500/10 text-emerald-700 flex items-center justify-center text-sm font-semibold shrink-0">
                          {p.siswa.nama.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium text-slate-800">{p.siswa.nama}</span>
                      </div>
                    </Td>
                    <Td className="font-mono text-xs text-slate-500">{p.siswa.nis}</Td>
                    {bolehPilihKelas && (
                      <Td>{p.kelas ? (labelKelas(p.kelas) ?? p.kelas) : <span className="text-slate-400">-</span>}</Td>
                    )}
                    <Td>
                      <Badge variant={p.mapel_terisi === p.mapel_total ? "success" : persenMapel >= 50 ? "warning" : "danger"}>
                        {p.mapel_terisi}/{p.mapel_total}
                      </Badge>
                    </Td>
                    <Td>
                      <Badge variant={p.praktik_terisi === p.praktik_total ? "success" : "default"}>
                        {p.praktik_terisi}/{p.praktik_total}
                      </Badge>
                    </Td>
                    <Td className="text-center">
                      <div className="flex items-center justify-center gap-2.5">
                        <IkonCheck ok={p.pembiasaan_terisi} />
                        <IkonCheck ok={p.sikap_terisi} />
                        <IkonCheck ok={p.kehadiran_terisi} />
                      </div>
                    </Td>
                    <Td className="whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link href={`/biodata-cetak?id=${p.siswa.id}`}>
                          <Button size="sm" variant="outline">Biodata</Button>
                        </Link>
                        <Link href={`/rapor-cetak?siswa_id=${p.siswa.id}&semester_id=${semesterId}`}>
                          <Button size="sm">Rapor</Button>
                        </Link>
                      </div>
                    </Td>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          <Pagination
            page={safePage}
            lastPage={lastPage}
            total={daftar.length}
            from={daftar.length === 0 ? 0 : (safePage - 1) * PER_HALAMAN + 1}
            to={Math.min(safePage * PER_HALAMAN, daftar.length)}
            label="siswa"
            onPageChange={setPage}
          />
        </Card>
      )}
    </div>
  );
}
