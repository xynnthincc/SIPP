"use client";

import { Suspense, useCallback, useEffect, useState, FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { PageHeader, Card, Button, Input, Skeleton, Alert } from "@/components/ui";

interface TahunAjaran {
  id: number;
  nama: string;
}

function TahunAjaranForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const idParam = searchParams.get("id");
  const isEdit = !!idParam;

  const [nama, setNama] = useState("");
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    api.get<TahunAjaran[]>("/tahun-ajaran").then((res) => {
      const ta = res.data.find((x) => String(x.id) === idParam);
      if (ta) setNama(ta.nama);
      setLoading(false);
    });
  }, [idParam]);

  useEffect(() => {
    if (idParam) load();
  }, [idParam, load]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      if (isEdit) {
        await api.put(`/tahun-ajaran/${idParam}`, { nama });
      } else {
        await api.post("/tahun-ajaran", { nama });
      }
      router.push("/admin/tahun-ajaran");
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

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={isEdit ? "Edit Tahun Ajaran" : "Tambah Tahun Ajaran"}
        description="Tahun ajaran baru otomatis dibuat dengan semester Ganjil dan Genap."
      />

      {error && (
        <div className="mb-6">
          <Alert variant="danger" onClose={() => setError(null)}>{error}</Alert>
        </div>
      )}

      <Card>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label="Nama Tahun Ajaran"
            value={nama}
            onChange={(e) => setNama(e.target.value)}
            placeholder="contoh: 2026/2027"
            required
          />
          <div className="flex justify-end gap-3">
            <Link href="/admin/tahun-ajaran">
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

export default function TahunAjaranFormPage() {
  return (
    <Suspense fallback={<Skeleton className="h-64 w-full" />}>
      <TahunAjaranForm />
    </Suspense>
  );
}
