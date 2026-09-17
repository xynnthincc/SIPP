"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import {
  PageHeader, Card, Button, Table, TableHead, TableBody, Th, Td, TableRow,
  Badge, Skeleton, EmptyState, ConfirmModal, IconButton, Alert,
} from "@/components/ui";

interface KelasRombel {
  id: number;
  nama: string;
  tingkat: number;
  siswas_count: number;
  wali_kelas: { id: number; name: string } | null;
}

export default function KelasPage() {
  const router = useRouter();
  const [data, setData] = useState<KelasRombel[]>([]);
  const [loading, setLoading] = useState(true);
  const [hapus, setHapus] = useState<KelasRombel | null>(null);
  const [hapusLoading, setHapusLoading] = useState(false);
  const [hapusError, setHapusError] = useState<string | null>(null);

  const load = useCallback(() => {
    api.get<KelasRombel[]>("/kelas-rombel").then((res) => {
      setData(res.data);
      setLoading(false);
    });
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleHapus() {
    if (!hapus) return;
    setHapusLoading(true);
    setHapusError(null);
    try {
      await api.delete(`/kelas-rombel/${hapus.id}`);
      setHapus(null);
      await load();
    } catch (err: unknown) {
      const pesan = (err as { response?: { data?: { message?: string } } })?.response?.data;
      setHapusError(pesan?.message ?? "Gagal menghapus kelas.");
    } finally {
      setHapusLoading(false);
    }
  }

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Kelas / Rombel"
        description="Kelola rombel dan penugasan wali kelas."
        action={<Button onClick={() => router.push("/admin/kelas/form")}>+ Tambah Kelas</Button>}
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
          title="Belum ada kelas"
          description="Buat kelas/rombel baru melalui tombol di atas."
          action={<Button onClick={() => router.push("/admin/kelas/form")}>+ Tambah Kelas</Button>}
        />
      ) : (
        <Card className="p-0">
          <Table>
            <TableHead>
              <Th>Kelas</Th>
              <Th>Tingkat</Th>
              <Th>Wali Kelas</Th>
              <Th>Jumlah Siswa</Th>
              <Th className="text-right">Aksi</Th>
            </TableHead>
            <TableBody>
              {data.map((k) => (
                <TableRow key={k.id}>
                  <Td className="font-medium text-slate-800">{k.nama}</Td>
                  <Td>
                    <Badge variant="info">Tingkat {k.tingkat}</Badge>
                  </Td>
                  <Td>{k.wali_kelas?.name ?? <span className="text-slate-400">-</span>}</Td>
                  <Td>
                    <span className="font-semibold text-slate-700">{k.siswas_count}</span>
                    <span className="text-slate-400"> siswa</span>
                  </Td>
                  <Td className="whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1">
                      <IconButton icon="edit" variant="edit" label="Edit kelas" onClick={() => router.push(`/admin/kelas/form?id=${k.id}`)} />
                      <IconButton icon="trash" variant="delete" label="Hapus kelas" onClick={() => { setHapus(k); setHapusError(null); }} />
                    </div>
                  </Td>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      <ConfirmModal
        open={hapus !== null}
        onClose={() => setHapus(null)}
        onConfirm={handleHapus}
        loading={hapusLoading}
        title="Hapus Kelas"
        message={`Yakin ingin menghapus kelas "${hapus?.nama}"? Siswa di kelas ini tidak ikut terhapus.`}
      />
    </div>
  );
}