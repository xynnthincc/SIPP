"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import {
  PageHeader, Card, Button, Table, TableHead, TableBody, Th, Td, TableRow,
  Badge, Skeleton, EmptyState, Modal, ConfirmModal, IconButton, Alert, Pagination,
} from "@/components/ui";

const PER_HALAMAN = 10;

interface PraktikItem {
  id: number;
  kode: string;
  nama_id: string;
  nama_ar: string | null;
  urutan: number;
}

interface Guru {
  id: number;
  nip: string | null;
  nama: string;
  no_hp: string | null;
  is_aktif: boolean;
  user: { email: string };
  praktik_items: { id: number; kode: string; nama_id: string; nama_ar: string | null }[];
}

export default function GuruPage() {
  const router = useRouter();
  const [data, setData] = useState<Guru[]>([]);
  const [loading, setLoading] = useState(true);
  const [hapus, setHapus] = useState<Guru | null>(null);
  const [hapusLoading, setHapusLoading] = useState(false);
  const [hapusError, setHapusError] = useState<string | null>(null);
  const [praktikList, setPraktikList] = useState<PraktikItem[]>([]);
  const [praktikGuru, setPraktikGuru] = useState<Guru | null>(null);
  const [praktikSelected, setPraktikSelected] = useState<number[]>([]);
  const [praktikLoading, setPraktikLoading] = useState(false);
  const [praktikError, setPraktikError] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const lastPage = Math.max(1, Math.ceil(data.length / PER_HALAMAN));
  const safePage = Math.min(page, lastPage);
  const tampil = data.slice((safePage - 1) * PER_HALAMAN, safePage * PER_HALAMAN);

  const load = useCallback(() => {
    api.get<Guru[]>("/guru").then((res) => {
      setData(res.data);
      setLoading(false);
    });
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    api.get<PraktikItem[]>("/praktik-item").then((res) => setPraktikList(res.data));
  }, []);

  async function toggleAktif(g: Guru) {
    await api.put(`/guru/${g.id}`, { is_aktif: !g.is_aktif });
    await load();
  }

  async function handleHapus() {
    if (!hapus) return;
    setHapusLoading(true);
    setHapusError(null);
    try {
      await api.delete(`/guru/${hapus.id}`);
      setHapus(null);
      await load();
    } catch (err: unknown) {
      const pesan = (err as { response?: { data?: { message?: string } } })?.response?.data;
      setHapusError(pesan?.message ?? "Gagal menghapus guru.");
    } finally {
      setHapusLoading(false);
    }
  }

  function bukaPraktik(g: Guru) {
    setPraktikGuru(g);
    setPraktikSelected(g.praktik_items?.map((p) => p.id) ?? []);
    setPraktikError(null);
  }

  function togglePraktik(id: number) {
    setPraktikSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  async function simpanPraktik() {
    if (!praktikGuru) return;
    setPraktikLoading(true);
    setPraktikError(null);
    try {
      await api.post(`/gurus/${praktikGuru.id}/praktik`, { praktik_item_ids: praktikSelected });
      setPraktikGuru(null);
      setPraktikSelected([]);
      await load();
    } catch (err: unknown) {
      const pesan = (err as { response?: { data?: { message?: string } } })?.response?.data;
      setPraktikError(pesan?.message ?? "Gagal menyimpan atomisasi praktik.");
    } finally {
      setPraktikLoading(false);
    }
  }

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Data Guru Pesantren"
        description="Menambahkan guru otomatis membuat akun login untuknya."
          action={<Button onClick={() => router.push("/admin/guru/form")}>+ Tambah Guru</Button>}
      />

      {hapusError && (
        <div className="mb-6">
          <Alert variant="danger" onClose={() => setHapusError(null)}>{hapusError}</Alert>
        </div>
      )}

      <Modal
        open={praktikGuru !== null}
        onClose={() => setPraktikGuru(null)}
        title={`Atomisasi Praktik: ${praktikGuru?.nama}`}
        description="Pilih item praktik/hafalan yang diampu guru ini."
        footer={
          <>
            <Button type="button" variant="outline" onClick={() => setPraktikGuru(null)}>Batal</Button>
            <Button type="button" onClick={simpanPraktik} loading={praktikLoading}>Simpan</Button>
          </>
        }
      >
        {praktikError && <p className="text-sm text-red-600 mb-3">{praktikError}</p>}
        {praktikList.length === 0 ? (
          <p className="text-sm text-slate-400">Belum ada item praktik. Buat dulu di menu Praktik &amp; Hafalan.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-80 overflow-y-auto pr-1">
            {praktikList.map((p) => (
              <label key={p.id} className="flex items-start gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={praktikSelected.includes(p.id)}
                  onChange={() => togglePraktik(p.id)}
                  className="mt-0.5 h-4 w-4 rounded border-slate-300 text-emerald-600"
                />
                <span>
                  {p.nama_id}
                  <span className="block text-xs text-slate-400">{p.kode}</span>
                </span>
              </label>
            ))}
          </div>
        )}
      </Modal>

      {loading ? (
        <Skeleton className="h-40 w-full" />
      ) : data.length === 0 ? (
        <EmptyState
          title="Belum ada guru"
          description="Tambahkan guru pesantren baru melalui tombol di atas."
        action={<Button onClick={() => router.push("/admin/guru/form")}>+ Tambah Guru</Button>}
        />
      ) : (
        <Card className="p-0">
          <Table>
            <TableHead>
              <Th>Nama</Th>
              <Th>Email</Th>
              <Th>NIP</Th>
              <Th>Status</Th>
              <Th className="text-right">Aksi</Th>
            </TableHead>
            <TableBody>
              {tampil.map((g) => (
                <TableRow key={g.id}>
                  <Td>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-emerald-500/10 text-emerald-700 flex items-center justify-center text-sm font-semibold shrink-0">
                        {g.nama.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-medium text-slate-800">{g.nama}</span>
                    </div>
                  </Td>
                  <Td className="text-slate-500">{g.user.email}</Td>
                  <Td className="font-mono text-xs">{g.nip ?? <span className="text-slate-400 font-sans">-</span>}</Td>
                  <Td>
                    <button
                      onClick={() => toggleAktif(g)}
                      title="Klik untuk mengubah status"
                      className="cursor-pointer"
                    >
                      <Badge variant={g.is_aktif ? "success" : "default"}>{g.is_aktif ? "Aktif" : "Nonaktif"}</Badge>
                    </button>
                  </Td>
                  <Td className="whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button type="button" variant="outline" size="sm" onClick={() => bukaPraktik(g)}>Praktik</Button>
                      <IconButton icon="edit" variant="edit" label="Edit guru" onClick={() => router.push(`/admin/guru/form?id=${g.id}`)} />
                      <IconButton icon="trash" variant="delete" label="Hapus guru" onClick={() => { setHapus(g); setHapusError(null); }} />
                    </div>
                  </Td>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <Pagination
            page={safePage}
            lastPage={lastPage}
            total={data.length}
            from={data.length === 0 ? 0 : (safePage - 1) * PER_HALAMAN + 1}
            to={Math.min(safePage * PER_HALAMAN, data.length)}
            label="guru"
            onPageChange={setPage}
          />
        </Card>
      )}

      <ConfirmModal
        open={hapus !== null}
        onClose={() => setHapus(null)}
        onConfirm={handleHapus}
        loading={hapusLoading}
        title="Hapus Guru"
        message={`Yakin ingin menghapus guru "${hapus?.nama}" beserta akun loginnya?`}
      />
    </div>
  );
}