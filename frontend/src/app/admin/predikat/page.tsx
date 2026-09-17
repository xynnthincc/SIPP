"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import {
  PageHeader, Card, Button, Table, TableHead, TableBody, Th, Td, TableRow,
  Badge, Skeleton, EmptyState, ConfirmModal, IconButton, Alert,
} from "@/components/ui";

interface PredikatRange {
  id: number;
  nama: string;
  nilai_min: number;
  nilai_max: number;
}

export default function PredikatPage() {
  const router = useRouter();
  const [data, setData] = useState<PredikatRange[]>([]);
  const [loading, setLoading] = useState(true);
  const [hapus, setHapus] = useState<PredikatRange | null>(null);
  const [hapusLoading, setHapusLoading] = useState(false);
  const [hapusError, setHapusError] = useState<string | null>(null);

  const load = useCallback(() => {
    api.get<PredikatRange[]>("/predikat-range").then((res) => {
      setData(res.data);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleHapus() {
    if (!hapus) return;
    setHapusLoading(true);
    setHapusError(null);
    try {
      await api.delete(`/predikat-range/${hapus.id}`);
      setHapus(null);
      await load();
    } catch (err: unknown) {
      const pesan = (err as { response?: { data?: { message?: string } } })?.response?.data;
      setHapusError(pesan?.message ?? "Gagal menghapus predikat.");
    } finally {
      setHapusLoading(false);
    }
  }

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Rentang Predikat"
        description="Konversi nilai akhir ke predikat rapor (pola e-rapor Kurikulum Merdeka)."
        action={<Button onClick={() => router.push("/admin/predikat/form")}>+ Tambah Predikat</Button>}
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
          title="Belum ada rentang predikat"
          description="Tambahkan rentang predikat untuk konversi nilai akhir ke predikat rapor."
          action={<Button onClick={() => router.push("/admin/predikat/form")}>+ Tambah Predikat</Button>}
        />
      ) : (
        <Card className="p-0">
          <Table>
            <TableHead>
              <Th>Nama Predikat</Th>
              <Th>Rentang Nilai</Th>
              <Th className="text-right">Aksi</Th>
            </TableHead>
            <TableBody>
              {data.map((p) => (
                <TableRow key={p.id}>
                  <Td>
                    <Badge variant="success">{p.nama}</Badge>
                  </Td>
                  <Td className="text-slate-600">
                    {Number(p.nilai_min)} – {Number(p.nilai_max)}
                  </Td>
                  <Td className="whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1">
                      <IconButton icon="edit" variant="edit" label="Edit predikat" onClick={() => router.push(`/admin/predikat/form?id=${p.id}`)} />
                      <IconButton icon="trash" variant="delete" label="Hapus predikat" onClick={() => { setHapus(p); setHapusError(null); }} />
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
        title="Hapus Predikat"
        message={`Yakin ingin menghapus rentang predikat "${hapus?.nama}"? Rapor yang sudah memakai predikat ini tidak berubah.`}
      />
    </div>
  );
}