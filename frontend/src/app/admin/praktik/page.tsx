"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import {
  PageHeader, Card, Button, Skeleton, EmptyState, ConfirmModal, IconButton, Alert,
} from "@/components/ui";

interface PraktikItem {
  id: number;
  kode: string;
  nama_id: string;
  nama_ar: string | null;
  urutan: number;
  nilai_praktiks_count: number;
}

export default function PraktikPage() {
  const router = useRouter();
  const [data, setData] = useState<PraktikItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [hapus, setHapus] = useState<{ id: number; nama: string } | null>(null);
  const [hapusLoading, setHapusLoading] = useState(false);
  const [hapusError, setHapusError] = useState<string | null>(null);

  const load = useCallback(() => {
    api.get<PraktikItem[]>("/praktik-item").then((res) => {
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
      await api.delete(`/praktik-item/${hapus.id}`);
      setHapus(null);
      await load();
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
        title="Praktik & Hafalan"
        description="Item praktik ibadah dan hafalan yang dinilai pada rapor kepesantrenan."
        action={<Button onClick={() => router.push("/admin/praktik/form")}>+ Tambah Item</Button>}
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
          title="Belum ada item praktik"
          description="Tambahkan item praktik & hafalan baru."
          action={<Button onClick={() => router.push("/admin/praktik/form")}>+ Tambah Item</Button>}
        />
      ) : (
        <div className="space-y-3">
          {data.map((p) => (
            <Card key={p.id} className="p-0">
              <div className="flex items-center justify-between gap-3 px-5 py-4">
                <div className="flex flex-col items-start gap-2 min-w-0">
                  <span className="font-mono text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-2.5 py-0.5">
                    {p.kode}
                  </span>
                  <span className="flex flex-wrap items-baseline gap-x-2.5 min-w-0 w-full">
                    <span className="font-semibold text-slate-800">{p.nama_id}</span>
                    {p.nama_ar && (
                      <>
                        <span className="text-slate-300 select-none">|</span>
                        <span className="text-sm text-slate-500 font-medium" dir="rtl">{p.nama_ar}</span>
                      </>
                    )}
                  </span>
                  <span className="text-xs text-slate-500">
                    Urutan <span className="font-semibold text-slate-700">{p.urutan}</span>
                    <span className="mx-1.5 text-slate-300">•</span>
                    {p.nilai_praktiks_count > 0 ? (
                      <><span className="font-semibold text-slate-700">{p.nilai_praktiks_count}</span> nilai tercatat</>
                    ) : (
                      <span className="text-slate-400">Belum ada nilai</span>
                    )}
                  </span>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <IconButton icon="edit" variant="edit" label="Edit item" onClick={() => router.push(`/admin/praktik/form?id=${p.id}`)} />
                  <IconButton
                    icon="trash"
                    variant="delete"
                    label="Hapus item"
                    onClick={() => { setHapus({ id: p.id, nama: p.nama_id }); setHapusError(null); }}
                  />
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <ConfirmModal
        open={hapus !== null}
        onClose={() => setHapus(null)}
        onConfirm={handleHapus}
        loading={hapusLoading}
        title="Hapus Item Praktik"
        message={`Yakin ingin menghapus "${hapus?.nama}"?`}
      />
    </div>
  );
}