"use client";

import { FormEvent, Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import { PageHeader, Card, Button, Input, Alert, Skeleton } from "@/components/ui";

interface PraktikItem {
  id: number;
  kode: string;
  nama_id: string;
  nama_ar: string | null;
  urutan: number;
}

const emptyForm = { kode: "", nama_id: "", nama_ar: "", urutan: "" };

function PraktikFormInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const idParam = searchParams.get("id");
  const isEdit = !!idParam;

  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    api.get<PraktikItem[]>("/praktik-item").then((res) => {
      const item = res.data.find((p) => String(p.id) === idParam);
      if (item) {
        setForm({ kode: item.kode, nama_id: item.nama_id, nama_ar: item.nama_ar ?? "", urutan: String(item.urutan) });
      }
      setLoading(false);
    });
  }, [idParam]);

  useEffect(() => { if (idParam) load(); }, [idParam, load]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const body = {
        kode: form.kode,
        nama_id: form.nama_id,
        nama_ar: form.nama_ar || undefined,
        urutan: Number(form.urutan),
      };
      if (isEdit) {
        await api.put(`/praktik-item/${idParam}`, {
          nama_id: body.nama_id,
          nama_ar: body.nama_ar,
          urutan: body.urutan,
        });
      } else {
        await api.post("/praktik-item", body);
      }
      router.push("/admin/praktik");
    } catch (err: unknown) {
      const pesan = (err as { response?: { data?: { message?: string } } })?.response?.data;
      setError(pesan?.message ?? "Gagal menyimpan item praktik.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <Skeleton className="h-64 w-full" />;
  }

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={isEdit ? "Edit Item Praktik" : "Tambah Item Praktik"}
        description="Item dinilai dengan nilai praktik pada rapor siswa."
      />

      {error && (
        <div className="mb-6">
          <Alert variant="danger" onClose={() => setError(null)}>{error}</Alert>
        </div>
      )}

      <Card>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <Input
            label="Kode"
            value={form.kode}
            onChange={(e) => setForm({ ...form, kode: e.target.value.toUpperCase() })}
            placeholder="WUDHU"
            required
            disabled={isEdit}
            hint={isEdit ? "Kode tidak dapat diubah" : undefined}
          />
          <Input
            label="Nama (Indonesia)"
            value={form.nama_id}
            onChange={(e) => setForm({ ...form, nama_id: e.target.value })}
            placeholder="contoh: Wudhu"
            required
          />
          <Input
            label="Nama (Arab)"
            value={form.nama_ar}
            onChange={(e) => setForm({ ...form, nama_ar: e.target.value })}
            placeholder="contoh: الوضوء"
            dir="rtl"
          />
          <Input
            label="Urutan"
            type="number"
            min={0}
            value={form.urutan}
            onChange={(e) => setForm({ ...form, urutan: e.target.value })}
            required
            hint="Urutan tampil di rapor"
          />
          <div className="col-span-full flex justify-end gap-3 mt-2">
            <Link href="/admin/praktik">
              <Button type="button" variant="outline">Batal</Button>
            </Link>
            <Button type="submit" loading={saving}>
              {isEdit ? "Simpan Perubahan" : "Simpan Item"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

export default function PraktikFormPage() {
  return (
    <Suspense fallback={<Skeleton className="h-64 w-full" />}>
      <PraktikFormInner />
    </Suspense>
  );
}
