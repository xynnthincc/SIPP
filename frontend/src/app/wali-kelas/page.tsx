"use client";

import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { labelKelas, labelTingkat } from "@/lib/kelas";
import {
  PageHeader, Card, Badge, Button, Input, Skeleton, EmptyState, Pagination,
  Table, TableHead, TableBody, Th, Td, TableRow,
} from "@/components/ui";

interface SiswaBinaan {
  id: number;
  nis: string;
  nama: string;
  jenis_kelamin: "L" | "P";
  tempat_lahir: string | null;
  tanggal_lahir: string | null;
  is_aktif: boolean;
}

interface KelasInfo {
  id: number;
  nama: string;
  tingkat: number;
  siswas_count: number;
}

const PER_HALAMAN = 10;

function formatTanggal(nilai: string | null): string {
  if (!nilai) return "-";
  const d = new Date(nilai);
  return Number.isNaN(d.getTime())
    ? nilai
    : d.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
}

export default function SiswaBinaanPage() {
  const { user } = useAuth();
  const [kelas, setKelas] = useState<KelasInfo | null>(null);
  const [siswas, setSiswas] = useState<SiswaBinaan[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState("");
  const [committedSearch, setCommittedSearch] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (!user) return;
    api.get<KelasInfo[]>("/kelas-rombel").then((res) => {
      const kelasSaya = res.data[0] ?? null;
      setKelas(kelasSaya);
      if (kelasSaya) {
        return api.get("/siswa", { params: { kelas_rombel_id: kelasSaya.id } }).then((r) => {
          const daftar: SiswaBinaan[] = r.data.data ?? r.data;
          daftar.sort((a, b) => a.nama.localeCompare(b.nama, "id-ID"));
          setSiswas(daftar);
        });
      }
    }).catch(() => undefined).finally(() => setLoading(false));
  }, [user]);

  const hasilCari = useMemo(() => {
    const kata = committedSearch.trim().toLowerCase();
    if (!kata) return siswas;
    return siswas.filter(
      (s) => s.nama.toLowerCase().includes(kata) || s.nis.includes(kata)
    );
  }, [siswas, committedSearch]);

  const halamanTerakhir = Math.max(1, Math.ceil(hasilCari.length / PER_HALAMAN));
  const halamanAman = Math.min(page, halamanTerakhir);
  const siswaTampil = hasilCari.slice((halamanAman - 1) * PER_HALAMAN, halamanAman * PER_HALAMAN);

  const jumlahL = siswas.filter((s) => s.jenis_kelamin === "L").length;
  const jumlahP = siswas.length - jumlahL;

  function cari() {
    setCommittedSearch(searchInput);
    setPage(1);
  }

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Siswa Binaan"
        description={
          kelas
            ? `Daftar siswa ${labelKelas(kelas.nama) ?? "-"} — diampu sebagai wali kelas.`
            : "Daftar siswa di kelas yang Anda walikan."
        }
      />

      {loading ? (
        <Skeleton className="h-64 w-full" />
      ) : !kelas ? (
        <EmptyState
          title="Belum ada kelas binaan"
          description="Anda belum ditetapkan sebagai wali kelas. Hubungi admin untuk penugasan kelas."
        />
      ) : (
        <div className="space-y-5 sm:space-y-6">
          {/* Ringkasan kelas */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Total Siswa</p>
              <p className="text-2xl font-bold text-slate-800 mt-1">{siswas.length}</p>
              <p className="text-xs text-slate-400 mt-0.5">{labelKelas(kelas.nama) ?? "-"} • Tingkat {labelTingkat(kelas.tingkat)}</p>
            </Card>
            <Card>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Laki-laki</p>
              <p className="text-2xl font-bold text-slate-800 mt-1">{jumlahL}</p>
              <p className="text-xs text-slate-400 mt-0.5">siswa</p>
            </Card>
            <Card>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Perempuan</p>
              <p className="text-2xl font-bold text-slate-800 mt-1">{jumlahP}</p>
              <p className="text-xs text-slate-400 mt-0.5">siswa</p>
            </Card>
          </div>

          {/* Filter — layout sama seperti Data Siswa admin */}
          <Card>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Cari nama atau NIS…"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") cari();
                  }}
                />
              </div>
              <Button variant="outline" className="w-full sm:w-auto" onClick={cari}>
                Cari
              </Button>
            </div>
          </Card>

          {siswas.length === 0 ? (
            <EmptyState title="Tidak ada siswa" description="Kelas yang Anda walikan belum memiliki siswa." />
          ) : (
            <Card className="p-0">
              <Table>
                <TableHead>
                  <Th className="w-12">No</Th>
                  <Th>Nama Siswa</Th>
                  <Th>NIS</Th>
                  <Th>Jenis Kelamin</Th>
                  <Th>Tempat &amp; Tanggal Lahir</Th>
                  <Th>Status</Th>
                </TableHead>
                <TableBody>
                  {siswaTampil.map((s, i) => (
                    <TableRow key={s.id}>
                      <Td className="text-slate-400">{(halamanAman - 1) * PER_HALAMAN + i + 1}</Td>
                      <Td>
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-emerald-500/10 text-emerald-700 flex items-center justify-center text-sm font-semibold shrink-0">
                            {s.nama.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-medium text-slate-800">{s.nama}</span>
                        </div>
                      </Td>
                      <Td className="font-mono text-xs text-slate-500">{s.nis}</Td>
                      <Td className="text-slate-500">{s.jenis_kelamin === "L" ? "Laki-laki" : "Perempuan"}</Td>
                      <Td>
                        {s.tempat_lahir || s.tanggal_lahir ? (
                          <span className="text-slate-600">
                            {s.tempat_lahir ?? "-"}, {formatTanggal(s.tanggal_lahir)}
                          </span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </Td>
                      <Td>
                        <Badge variant={s.is_aktif ? "success" : "default"}>
                          {s.is_aktif ? "Aktif" : "Nonaktif"}
                        </Badge>
                      </Td>
                    </TableRow>
                  ))}
                  {siswaTampil.length === 0 && (
                    <TableRow>
                      <Td colSpan={6} className="text-center text-slate-400 py-8">
                        Tidak ada siswa yang cocok dengan pencarian &ldquo;{committedSearch}&rdquo;.
                      </Td>
                    </TableRow>
                  )}
                </TableBody>
              </Table>

              <Pagination
                page={halamanAman}
                lastPage={halamanTerakhir}
                total={hasilCari.length}
                from={hasilCari.length === 0 ? 0 : (halamanAman - 1) * PER_HALAMAN + 1}
                to={Math.min(halamanAman * PER_HALAMAN, hasilCari.length)}
                label="siswa"
                onPageChange={setPage}
              />
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
