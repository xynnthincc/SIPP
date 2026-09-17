"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { labelKelas } from "@/lib/kelas";
import {
  PageHeader, Card, Button, Input, Select, Table, TableHead, TableBody, Th, Td, TableRow,
  Badge, Skeleton, EmptyState, ConfirmModal, IconButton, Alert, Pagination,
} from "@/components/ui";

interface Siswa {
  id: number;
  nis: string;
  nama: string;
  jenis_kelamin: "L" | "P";
  is_aktif: boolean;
  kelas_rombel: { id: number; nama: string } | null;
  tempat_lahir?: string | null;
  tanggal_lahir?: string | null;
  alamat?: string | null;
  agama?: string | null;
  sekolah_asal?: string | null;
  nama_ayah?: string | null;
  no_wa_ayah?: string | null;
  profesi_ayah?: string | null;
  nama_ibu?: string | null;
  no_telp_ibu?: string | null;
  profesi_ibu?: string | null;
  status_anak?: string | null;
  anak_ke?: string | null;
  no_telp?: string | null;
  nama_wali?: string | null;
  pekerjaan_wali?: string | null;
  alamat_wali?: string | null;
  no_telp_wali?: string | null;
}

interface KelasOption {
  id: number;
  nama: string;
}

interface PaginatedSiswa {
  data?: Siswa[];
  current_page?: number;
  last_page?: number;
  total?: number;
  from?: number | null;
  to?: number | null;
}

export default function SiswaPage() {
  const router = useRouter();
  const [data, setData] = useState<Siswa[]>([]);
  const [kelasList, setKelasList] = useState<KelasOption[]>([]);
  const [meta, setMeta] = useState({ page: 1, lastPage: 1, total: 0, from: 0, to: 0 });
  const [searchInput, setSearchInput] = useState("");
  const [committedSearch, setCommittedSearch] = useState("");
  const [kelasFilter, setKelasFilter] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [hapus, setHapus] = useState<Siswa | null>(null);
  const [hapusLoading, setHapusLoading] = useState(false);
  const [hapusError, setHapusError] = useState<string | null>(null);

  const load = useCallback(() => {
    api.get("/siswa", {
      params: {
        page,
        search: committedSearch || undefined,
        kelas_rombel_id: kelasFilter || undefined,
      },
    }).then((res) => {
      const payload = res.data as Siswa[] | PaginatedSiswa;
      if (Array.isArray(payload)) {
        setData(payload);
        setMeta({ page: 1, lastPage: 1, total: payload.length, from: payload.length ? 1 : 0, to: payload.length });
      } else {
        const list = payload.data ?? [];
        setData(list);
        setMeta({
          page: payload.current_page ?? 1,
          lastPage: payload.last_page ?? 1,
          total: payload.total ?? list.length,
          from: payload.from ?? (list.length ? 1 : 0),
          to: payload.to ?? list.length,
        });
      }
      setLoading(false);
    });
  }, [page, committedSearch, kelasFilter]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    api.get<KelasOption[]>("/kelas-rombel").then((res) => setKelasList(res.data));
  }, []);

  async function handleHapus() {
    if (!hapus) return;
    setHapusLoading(true);
    setHapusError(null);
    try {
      await api.delete(`/siswa/${hapus.id}`);
      setHapus(null);
      await load();
    } catch (err: unknown) {
      const pesan = (err as { response?: { data?: { message?: string } } })?.response?.data;
      setHapusError(pesan?.message ?? "Gagal menghapus siswa.");
    } finally {
      setHapusLoading(false);
    }
  }

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Data Siswa"
        description="Kelola seluruh data siswa SMP Plus YPP Darussurur."
        action={<Button onClick={() => router.push("/admin/siswa/form")}>+ Tambah Siswa</Button>}
      />

      {hapusError && (
        <div className="mb-6">
          <Alert variant="danger" onClose={() => setHapusError(null)}>{hapusError}</Alert>
        </div>
      )}

      {/* Filter */}
      <Card className="mb-5 sm:mb-6">
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <div className="flex-1">
            <Input
              placeholder="Cari nama atau NIS…"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  setCommittedSearch(searchInput);
                  setPage(1);
                }
              }}
            />
          </div>
          <div className="w-full sm:w-52">
            <Select
              value={kelasFilter}
              onChange={(e) => {
                setKelasFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="">Semua Kelas</option>
              {kelasList.map((k) => (
                <option key={k.id} value={k.id}>{k.nama}</option>
              ))}
            </Select>
          </div>
          <Button
            variant="outline"
            className="w-full sm:w-auto"
            onClick={() => {
              setCommittedSearch(searchInput);
              setPage(1);
            }}
          >
            Cari
          </Button>
        </div>
      </Card>

      {loading ? (
        <Skeleton className="h-64 w-full" />
      ) : data.length === 0 ? (
        <EmptyState
          title="Belum ada siswa"
          description="Tambahkan siswa baru melalui tombol Tambah Siswa."
          action={<Button onClick={() => router.push("/admin/siswa/form")}>+ Tambah Siswa</Button>}
        />
      ) : (
        <Card className="p-0">
          <Table>
            <TableHead>
              <Th className="w-12">No</Th>
              <Th>Nama Siswa</Th>
              <Th>NIS</Th>
              <Th>Kelas</Th>
              <Th>Jenis Kelamin</Th>
              <Th>Status</Th>
              <Th className="text-right">Aksi</Th>
            </TableHead>
            <TableBody>
              {data.map((s, i) => (
                <TableRow key={s.id}>
                  <Td className="text-slate-400">{meta.from + i}</Td>
                  <Td>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-emerald-500/10 text-emerald-700 flex items-center justify-center text-sm font-semibold shrink-0">
                        {s.nama.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-medium text-slate-800">{s.nama}</span>
                    </div>
                  </Td>
                  <Td className="font-mono text-xs text-slate-500">{s.nis}</Td>
                  <Td>{labelKelas(s.kelas_rombel?.nama) ?? <span className="text-slate-400">-</span>}</Td>
                  <Td className="text-slate-500">{s.jenis_kelamin === "L" ? "Laki-laki" : "Perempuan"}</Td>
                  <Td>
                    <Badge variant={s.is_aktif !== false ? "success" : "default"}>
                      {s.is_aktif !== false ? "Aktif" : "Nonaktif"}
                    </Badge>
                  </Td>
                  <Td className="whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1">
                      <IconButton icon="print" variant="print" label="Cetak biodata" onClick={() => router.push(`/biodata-cetak?id=${s.id}`)} />
                      <IconButton icon="edit" variant="edit" label="Edit siswa" onClick={() => router.push(`/admin/siswa/form?id=${s.id}`)} />
                      <IconButton icon="trash" variant="delete" label="Hapus siswa" onClick={() => { setHapus(s); setHapusError(null); }} />
                    </div>
                  </Td>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Pagination */}
          <Pagination
            page={meta.page}
            lastPage={meta.lastPage}
            total={meta.total}
            from={meta.from}
            to={meta.to}
            label="siswa"
            onPageChange={setPage}
          />
        </Card>
      )}

      <ConfirmModal
        open={hapus !== null}
        onClose={() => setHapus(null)}
        onConfirm={handleHapus}
        loading={hapusLoading}
        title="Hapus Siswa"
        message={`Yakin ingin menghapus siswa "${hapus?.nama}"? Data nilai, presensi, dan rapor terkait juga akan terhapus.`}
      />
    </div>
  );
}