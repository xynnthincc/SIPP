"use client";

import { FormEvent, Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import { PageHeader, Card, Button, Input, Select, Skeleton, Alert } from "@/components/ui";

interface KelasRombel {
  id: number;
  nama: string;
  tingkat: number;
}

interface TahunAjaran {
  id: number;
  nama: string;
  is_aktif: boolean;
}

export default function KelasFormPage() {
  return (
    <Suspense fallback={<Skeleton className="h-64 w-full" />}>
      <KelasForm />
    </Suspense>
  );
}

function KelasForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const idParam = searchParams.get("id");
  const isEdit = !!idParam;

  // "kelas" = jenjang diniyah (Tamhidi/Qitsmu → tingkat 7/8/9), "rombel" = huruf pecahan
  const [form, setForm] = useState({ kelas: "7", rombel: "", tahun_ajaran_id: "" });
  const [tahunList, setTahunList] = useState<TahunAjaran[]>([]);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.get<TahunAjaran[]>("/tahun-ajaran").then((res) => {
      setTahunList(res.data);
      if (!isEdit) {
        const aktif = res.data.find((t) => t.is_aktif);
        setForm((f) => ({ ...f, tahun_ajaran_id: String(aktif?.id ?? res.data[0]?.id ?? "") }));
      }
    });
  }, [isEdit]);

  const load = useCallback(() => {
    api.get<KelasRombel[]>("/kelas-rombel").then((res) => {
      const k = res.data.find((x) => String(x.id) === idParam);
      if (k) {
        // "7A" → kelas 7 + rombel "A"
        setForm({
          kelas: String(k.tingkat),
          rombel: k.nama.replace(/^\d+\s*/, ""),
          tahun_ajaran_id: "",
        });
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
    setError(null);
    const nama = `${form.kelas}${form.rombel.trim()}`;
    try {
      if (isEdit) {
        await api.put(`/kelas-rombel/${idParam}`, { nama, tingkat: Number(form.kelas) });
      } else {
        await api.post("/kelas-rombel", {
          nama,
          tingkat: Number(form.kelas),
          tahun_ajaran_id: Number(form.tahun_ajaran_id),
        });
      }
      router.push("/admin/kelas");
    } catch (err: unknown) {
      const pesan = (err as { response?: { data?: { message?: string } } })?.response?.data;
      setError(pesan?.message ?? "Gagal menyimpan kelas.");
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
        title={isEdit ? "Edit Kelas" : "Tambah Kelas"}
        description={isEdit ? "Perbarui data kelas." : "Kelas baru dibuat pada tahun ajaran terpilih."}
      />

      {error && (
        <div className="mb-6">
          <Alert variant="danger" onClose={() => setError(null)}>{error}</Alert>
        </div>
      )}

      <Card>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Select
            label="Kelas"
            value={form.kelas}
            onChange={(e) => setForm({ ...form, kelas: e.target.value })}
          >
            <option value="7">Tamhidi</option>
            <option value="8">Qitsmu Awwal</option>
            <option value="9">Qitsmu Tsani</option>
          </Select>
          <Input
            label="Rombel"
            value={form.rombel}
            onChange={(e) => setForm({ ...form, rombel: e.target.value })}
            placeholder="mis. A (boleh dikosongkan)"
            maxLength={10}
          />
          {!isEdit && (
            <Select
              label="Tahun Ajaran"
              value={form.tahun_ajaran_id}
              onChange={(e) => setForm({ ...form, tahun_ajaran_id: e.target.value })}
            >
              {tahunList.map((t) => (
                <option key={t.id} value={String(t.id)}>
                  {t.nama}
                </option>
              ))}
            </Select>
          )}
          <div className="col-span-full flex justify-end gap-3 mt-2">
            <Link href="/admin/kelas">
              <Button type="button" variant="outline">Batal</Button>
            </Link>
            <Button type="submit" loading={saving}>
              {isEdit ? "Simpan Perubahan" : "Simpan Kelas"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
