"use client";

import { Suspense, useCallback, useEffect, useState, FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { PageHeader, Card, Button, Input, Skeleton, Alert } from "@/components/ui";

interface PredikatRange {
  id: number;
  nama: string;
  nilai_min: number;
  nilai_max: number;
}

function PredikatForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const idParam = searchParams.get("id");
  const isEdit = !!idParam;

  const [form, setForm] = useState({ nama: "", nilai_min: "", nilai_max: "" });
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(() => {
    api.get<PredikatRange[]>("/predikat-range").then((res) => {
      const p = res.data.find((x) => String(x.id) === idParam);
      if (p) {
        setForm({ nama: p.nama, nilai_min: String(p.nilai_min), nilai_max: String(p.nilai_max) });
      }
      setLoading(false);
    });
  }, [idParam]);

  useEffect(() => {
    if (idParam) load();
  }, [idParam, load]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const body = {
        nama: form.nama,
        nilai_min: Number(form.nilai_min),
        nilai_max: Number(form.nilai_max),
      };
      if (isEdit) {
        await api.put(`/predikat-range/${idParam}`, body);
      } else {
        await api.post("/predikat-range", body);
      }
      router.push("/admin/predikat");
    } catch (err: unknown) {
      const pesan =
        (err as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } })
          ?.response?.data;
      setError(pesan?.errors ? Object.values(pesan.errors)[0][0] : (pesan?.message ?? "Gagal menyimpan."));
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
        title={isEdit ? "Edit Predikat" : "Tambah Predikat"}
        description="Rentang nilai digunakan untuk mengonversi nilai akhir menjadi predikat rapor."
      />

      {error && (
        <div className="mb-6">
          <Alert variant="danger" onClose={() => setError("")}>{error}</Alert>
        </div>
      )}

      <Card>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Input
            label="Nama Predikat"
            value={form.nama}
            onChange={(e) => setForm({ ...form, nama: e.target.value })}
            placeholder="Sangat Baik"
            required
          />
          <Input
            label="Nilai Minimal"
            type="number"
            min={0}
            max={100}
            step="0.01"
            value={form.nilai_min}
            onChange={(e) => setForm({ ...form, nilai_min: e.target.value })}
            placeholder="86"
            required
          />
          <Input
            label="Nilai Maksimal"
            type="number"
            min={0}
            max={100}
            step="0.01"
            value={form.nilai_max}
            onChange={(e) => setForm({ ...form, nilai_max: e.target.value })}
            placeholder="100"
            required
          />
          <div className="col-span-full mt-2 pt-5 border-t border-slate-200/50 flex justify-end gap-3">
            <Link href="/admin/predikat">
              <Button type="button" variant="outline">Batal</Button>
            </Link>
            <Button type="submit" loading={saving}>
              {isEdit ? "Simpan Perubahan" : "Simpan Predikat"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

export default function PredikatFormPage() {
  return (
    <Suspense fallback={<Skeleton className="h-64 w-full" />}>
      <PredikatForm />
    </Suspense>
  );
}
