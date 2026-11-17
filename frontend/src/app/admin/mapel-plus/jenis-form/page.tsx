"use client";

import { FormEvent, Suspense, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { PageHeader, Card, Button, Input, Select, Skeleton, Alert } from "@/components/ui";

interface JenisAssessment {
  id: number;
  nama: string;
  kategori: "formatif" | "sumatif";
  bobot: number;
}

function JenisAssessmentForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const mapelId = searchParams.get("mapel_id");
  const idParam = searchParams.get("id");
  const isEdit = !!idParam;
  const [form, setForm] = useState({ nama: "", kategori: "sumatif", bobot: "100" });
  const [mapelNama, setMapelNama] = useState<string | null>(null);
  const [loading, setLoading] = useState(!!mapelId);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    Promise.all([
      api.get<{ id: number; nama: string }[]>("/mapel-plus"),
      api.get<JenisAssessment[]>("/jenis-assessment", { params: { mapel_plus_id: mapelId } }),
    ]).then(([mapelRes, jenisRes]) => {
      setMapelNama(mapelRes.data.find((m) => String(m.id) === mapelId)?.nama ?? null);
      if (idParam) {
        const j = jenisRes.data.find((x) => String(x.id) === idParam);
        if (j) {
          setForm({ nama: j.nama, kategori: j.kategori, bobot: String(j.bobot) });
        }
      }
      setLoading(false);
    });
  }, [mapelId, idParam]);

  useEffect(() => { if (mapelId) load(); }, [mapelId, load]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const payload = { nama: form.nama, kategori: form.kategori, bobot: Number(form.bobot) };
      if (isEdit) {
        await api.put(`/jenis-assessment/${idParam}`, payload);
      } else {
        await api.post("/jenis-assessment", { ...payload, mapel_plus_id: Number(mapelId) });
      }
      router.push("/admin/mapel-plus");
    } catch (err: unknown) {
      const pesan = (err as { response?: { data?: { message?: string } } })?.response?.data;
      setError(pesan?.message ?? "Gagal menyimpan jenis assessment.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={isEdit ? "Edit Jenis Assessment" : "Tambah Jenis Assessment"}
        description={mapelNama ? `Untuk mata pelajaran: ${mapelNama}.` : "Sumatif dihitung dengan bobotnya; formatif hanya sebagai umpan balik proses."}
      />

      {error && (
        <div className="mb-6">
          <Alert variant="danger" onClose={() => setError(null)}>{error}</Alert>
        </div>
      )}

      {loading ? (
        <Skeleton className="h-64 w-full" />
      ) : (
        <Card>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="Nama Jenis Assessment"
              value={form.nama}
              onChange={(e) => setForm({ ...form, nama: e.target.value })}
              placeholder="contoh: Ujian Tengah Semester"
              required
            />
            <Select
              label="Kategori"
              value={form.kategori}
              onChange={(e) => setForm({ ...form, kategori: e.target.value })}
            >
              <option value="sumatif">Sumatif (dihitung)</option>
              <option value="formatif">Formatif (proses)</option>
            </Select>
            <Input
              label="Bobot (%)"
              type="number"
              min={0}
              max={100}
              value={form.bobot}
              onChange={(e) => setForm({ ...form, bobot: e.target.value })}
              required
              hint="Khusus sumatif — total bobot sumatif tiap mapel idealnya 100%"
            />
            <div className="col-span-full mt-2 pt-5 border-t border-slate-200/50 flex justify-end gap-3">
              <Link href="/admin/mapel-plus">
                <Button type="button" variant="outline">Batal</Button>
              </Link>
              <Button type="submit" loading={saving}>
                {isEdit ? "Simpan Perubahan" : "Simpan Jenis"}
              </Button>
            </div>
          </form>
        </Card>
      )}
    </div>
  );
}

export default function JenisAssessmentFormPage() {
  return (
    <Suspense fallback={<Skeleton className="h-64 w-full" />}>
      <JenisAssessmentForm />
    </Suspense>
  );
}
