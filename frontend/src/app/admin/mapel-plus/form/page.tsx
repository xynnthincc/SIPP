"use client";

import { Suspense, useCallback, useEffect, useState, FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { PageHeader, Card, Button, Input, Select, Skeleton, Alert } from "@/components/ui";

interface MapelPlus {
  id: number;
  kode: string;
  nama: string;
  nama_ar: string | null;
  kelompok: string | null;
  kkm_default: number;
  urutan: number;
  deskripsi: string | null;
  punya_progres_hafalan: boolean;
  jenis_assessments_count: number;
}

interface MapelForm {
  kode: string;
  nama: string;
  nama_ar: string;
  kelompok: string;
  kkm_default: string;
  urutan: string;
  punya_progres_hafalan: boolean;
}

const emptyMapel: MapelForm = {
  kode: "",
  nama: "",
  nama_ar: "",
  kelompok: "",
  kkm_default: "70",
  urutan: "0",
  punya_progres_hafalan: false,
};

function MapelPlusForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const idParam = searchParams.get("id");
  const isEdit = !!idParam;

  const [form, setForm] = useState<MapelForm>(emptyMapel);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    api.get<MapelPlus[]>("/mapel-plus").then((res) => {
      const item = res.data.find((m) => String(m.id) === idParam);
      if (item) {
        setForm({
          kode: item.kode,
          nama: item.nama,
          nama_ar: item.nama_ar ?? "",
          kelompok: item.kelompok ?? "",
          kkm_default: String(item.kkm_default),
          urutan: String(item.urutan),
          punya_progres_hafalan: item.punya_progres_hafalan,
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
    try {
      if (isEdit) {
        await api.put(`/mapel-plus/${idParam}`, {
          nama: form.nama,
          nama_ar: form.nama_ar || null,
          kelompok: form.kelompok || null,
          kkm_default: Number(form.kkm_default),
          urutan: Number(form.urutan),
          punya_progres_hafalan: form.punya_progres_hafalan,
        });
      } else {
        await api.post("/mapel-plus", {
          kode: form.kode,
          nama: form.nama,
          nama_ar: form.nama_ar || null,
          kelompok: form.kelompok || null,
          kkm_default: Number(form.kkm_default),
          urutan: Number(form.urutan),
          punya_progres_hafalan: form.punya_progres_hafalan,
        });
      }
      router.push("/admin/mapel-plus");
    } catch (err: unknown) {
      const pesan = (err as { response?: { data?: { message?: string } } })?.response?.data;
      setError(pesan?.message ?? "Gagal menyimpan mapel.");
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
        title={isEdit ? "Edit Mapel Plus" : "Tambah Mapel Plus"}
        description="Mapel plus adalah mata pelajaran kepesantrenan di luar mapel umum."
      />

      {error && (
        <div className="mb-6">
          <Alert variant="danger" onClose={() => setError(null)}>{error}</Alert>
        </div>
      )}

      <Card>
        <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Input
            label="Kode"
            value={form.kode}
            onChange={(e) => setForm({ ...form, kode: e.target.value.toUpperCase() })}
            placeholder="TAHFIDZ"
            required
            disabled={isEdit}
            hint={isEdit ? "Kode tidak dapat diubah" : undefined}
          />
          <Input
            label="Nama Mapel"
            value={form.nama}
            onChange={(e) => setForm({ ...form, nama: e.target.value })}
            placeholder="Tahfidz Al-Quran"
            required
          />
          <Input
            label="Nama Arab"
            value={form.nama_ar}
            onChange={(e) => setForm({ ...form, nama_ar: e.target.value })}
            placeholder="القرآن"
          />
          <Select
            label="Kelompok"
            value={form.kelompok}
            onChange={(e) => setForm({ ...form, kelompok: e.target.value })}
          >
            <option value="">Tidak ada</option>
            <option value="tahfidz">Tahfidz</option>
            <option value="tahsin">Tahsin</option>
            <option value="kitab_kuning">Kitab Kuning</option>
            <option value="bahasa_arab">Bahasa Arab</option>
            <option value="akhlak">Akhlak</option>
          </Select>
          <Input
            label="KKM Default"
            type="number"
            min={1}
            max={100}
            value={form.kkm_default}
            onChange={(e) => setForm({ ...form, kkm_default: e.target.value })}
            hint="Nilai ketuntasan minimal"
          />
          <Input
            label="Urutan"
            type="number"
            min={0}
            value={form.urutan}
            onChange={(e) => setForm({ ...form, urutan: e.target.value })}
            hint="Urutan tampil di rapor"
          />
          <label className="flex items-center gap-2.5 text-sm text-slate-700 cursor-pointer pt-1 sm:col-span-2 lg:col-span-3">
            <input
              type="checkbox"
              checked={form.punya_progres_hafalan}
              onChange={(e) => setForm({ ...form, punya_progres_hafalan: e.target.checked })}
              className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
            />
            Punya tracker hafalan
          </label>
          <div className="mt-6 pt-5 border-t border-slate-200/50 flex justify-end gap-3 sm:col-span-2 lg:col-span-3">
            <Link href="/admin/mapel-plus">
              <Button type="button" variant="outline">Batal</Button>
            </Link>
            <Button type="submit" loading={saving}>
              {isEdit ? "Simpan Perubahan" : "Simpan Mapel"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

export default function MapelPlusFormPage() {
  return (
    <Suspense fallback={<Skeleton className="h-64 w-full" />}>
      <MapelPlusForm />
    </Suspense>
  );
}
