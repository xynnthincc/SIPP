"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { PageHeader, Card, Button, Input, Alert, Skeleton } from "@/components/ui";

interface Sekolah {
  id: number;
  nama_sekolah: string;
  npsn: string | null;
  alamat: string | null;
  kelurahan: string | null;
  kecamatan: string | null;
  kota_kabupaten: string | null;
  provinsi: string | null;
  kode_pos: string | null;
  telepon: string | null;
  kepala_sekolah: string | null;
  nip_kepala_sekolah: string | null;
}

const emptyForm = {
  nama_sekolah: "",
  npsn: "",
  alamat: "",
  kelurahan: "",
  kecamatan: "",
  kota_kabupaten: "",
  provinsi: "",
  kode_pos: "",
  telepon: "",
  kepala_sekolah: "",
  nip_kepala_sekolah: "",
};

type SekolahForm = typeof emptyForm;

export default function SekolahPage() {
  const [form, setForm] = useState<SekolahForm>(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const load = useCallback(() => {
    api.get<Sekolah>("/sekolah")
      .then((res) => {
        setForm({
          nama_sekolah: res.data.nama_sekolah ?? "",
          npsn: res.data.npsn ?? "",
          alamat: res.data.alamat ?? "",
          kelurahan: res.data.kelurahan ?? "",
          kecamatan: res.data.kecamatan ?? "",
          kota_kabupaten: res.data.kota_kabupaten ?? "",
          provinsi: res.data.provinsi ?? "",
          kode_pos: res.data.kode_pos ?? "",
          telepon: res.data.telepon ?? "",
          kepala_sekolah: res.data.kepala_sekolah ?? "",
          nip_kepala_sekolah: res.data.nip_kepala_sekolah ?? "",
        });
      })
      .catch(() => setError("Gagal memuat profil sekolah."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const setField = (field: keyof SekolahForm, value: string) => {
    setForm({ ...form, [field]: value });
  };

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      await api.put("/sekolah", {
        nama_sekolah: form.nama_sekolah,
        npsn: form.npsn || null,
        alamat: form.alamat || null,
        kelurahan: form.kelurahan || null,
        kecamatan: form.kecamatan || null,
        kota_kabupaten: form.kota_kabupaten || null,
        provinsi: form.provinsi || null,
        kode_pos: form.kode_pos || null,
        telepon: form.telepon || null,
        kepala_sekolah: form.kepala_sekolah || null,
        nip_kepala_sekolah: form.nip_kepala_sekolah || null,
      });
      setSuccess("Profil sekolah berhasil disimpan.");
    } catch (err: unknown) {
      const pesan = (err as { response?: { data?: { message?: string } } })?.response?.data;
      setError(pesan?.message ?? "Gagal menyimpan profil sekolah.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Profil Sekolah"
        description="Identitas SMP Plus YPP Darussurur yang tampil di rapor dan dokumen resmi."
      />

      {(error || success) && (
        <div className="mb-6">
          {error && <Alert variant="danger" onClose={() => setError(null)}>{error}</Alert>}
          {success && <Alert variant="success" onClose={() => setSuccess(null)}>{success}</Alert>}
        </div>
      )}

      {loading ? (
        <Skeleton className="h-96 w-full" />
      ) : (
        <form onSubmit={handleSubmit}>
          <Card>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              <div className="md:col-span-2 xl:col-span-3">
                <Input
                  label="Nama Sekolah"
                  value={form.nama_sekolah}
                  onChange={(e) => setField("nama_sekolah", e.target.value)}
                  placeholder="SMP PLUS YPP DARUSSURUR"
                  required
                />
              </div>
              <Input
                label="NPSN"
                value={form.npsn}
                onChange={(e) => setField("npsn", e.target.value)}
                placeholder="contoh: 20219877"
              />
              <Input
                label="Telepon"
                value={form.telepon}
                onChange={(e) => setField("telepon", e.target.value)}
                placeholder="contoh: (0265) 732045"
              />
              <div className="md:col-span-2 xl:col-span-3">
                <Input
                  label="Alamat"
                  value={form.alamat}
                  onChange={(e) => setField("alamat", e.target.value)}
                  placeholder="Jl. ..."
                />
              </div>
              <Input
                label="Kelurahan"
                value={form.kelurahan}
                onChange={(e) => setField("kelurahan", e.target.value)}
              />
              <Input
                label="Kecamatan"
                value={form.kecamatan}
                onChange={(e) => setField("kecamatan", e.target.value)}
              />
              <Input
                label="Kota/Kabupaten"
                value={form.kota_kabupaten}
                onChange={(e) => setField("kota_kabupaten", e.target.value)}
              />
              <Input
                label="Provinsi"
                value={form.provinsi}
                onChange={(e) => setField("provinsi", e.target.value)}
              />
              <Input
                label="Kode Pos"
                value={form.kode_pos}
                onChange={(e) => setField("kode_pos", e.target.value)}
                placeholder="contoh: 43263"
              />
              <div className="md:col-span-2 xl:col-span-3">
                <Input
                  label="Kepala Sekolah"
                  value={form.kepala_sekolah}
                  onChange={(e) => setField("kepala_sekolah", e.target.value)}
                  placeholder="Nama Kepala Sekolah"
                />
              </div>
              <div className="md:col-span-2 xl:col-span-3">
                <Input
                  label="NIP Kepala Sekolah"
                  value={form.nip_kepala_sekolah}
                  onChange={(e) => setField("nip_kepala_sekolah", e.target.value)}
                  placeholder="NIP Kepala Sekolah"
                />
              </div>
            </div>
            <div className="mt-6 pt-5 border-t border-slate-200/50 flex justify-end">
              <Button type="submit" loading={saving}>Simpan Perubahan</Button>
            </div>
          </Card>
        </form>
      )}
    </div>
  );
}