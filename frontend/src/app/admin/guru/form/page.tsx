"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { api } from "@/lib/api";
import { PageHeader, Card, Button, Input, Alert, Skeleton } from "@/components/ui";

interface GuruWithUser {
  id: number;
  nama: string;
  nip: string | null;
  no_hp: string | null;
  is_aktif: boolean;
  user?: { email: string } | null;
}

const emptyForm = { nama: "", email: "", password: "", nip: "", no_hp: "" };

function GuruFormInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const idParam = searchParams.get("id");
  const isEdit = !!idParam;

  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAktif, setIsAktif] = useState(true);

  const load = useCallback(() => {
    api.get<GuruWithUser[]>("/guru").then((res) => {
      const g = res.data.find((x) => String(x.id) === idParam);
      if (g) {
        setForm({ nama: g.nama, email: g.user?.email ?? "", password: "", nip: g.nip ?? "", no_hp: g.no_hp ?? "" });
        setIsAktif(g.is_aktif !== false);
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
        await api.put(`/guru/${idParam}`, {
          nama: form.nama,
          no_hp: form.no_hp || null,
          is_aktif: isAktif,
        });
      } else {
        await api.post("/guru", {
          nama: form.nama,
          email: form.email,
          password: form.password,
          nip: form.nip || null,
          no_hp: form.no_hp || null,
        });
      }
      router.push("/admin/guru");
    } catch (err: unknown) {
      const pesan = (err as { response?: { data?: { message?: string } } })?.response?.data;
      setError(pesan?.message ?? "Gagal menyimpan guru.");
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
        title={isEdit ? "Edit Guru" : "Tambah Guru"}
        description={isEdit ? "Perbarui data guru." : "Guru baru otomatis mendapat akun login dengan email dan password di bawah."}
      />

      {error && (
        <div className="mb-6">
          <Alert variant="danger" onClose={() => setError(null)}>{error}</Alert>
        </div>
      )}

      <Card>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="sm:col-span-2 lg:col-span-3">
            <Input
              label="Nama Lengkap"
              value={form.nama}
              onChange={(e) => setForm({ ...form, nama: e.target.value })}
              placeholder="Nama guru"
              required
            />
          </div>
          {!isEdit && (
            <>
              <Input
                label="Email Login"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="email@guru.id"
                required
              />
              <Input
                label="Password Awal"
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="Min 8 karakter"
                required
              />
            </>
          )}
          <Input
            label="NIP/NUPTK"
            value={form.nip}
            onChange={(e) => setForm({ ...form, nip: e.target.value })}
            disabled={isEdit}
            placeholder="Opsional"
            hint={isEdit ? "NIP tidak dapat diubah" : undefined}
          />
          <Input
            label="No. HP"
            value={form.no_hp}
            onChange={(e) => setForm({ ...form, no_hp: e.target.value })}
            placeholder="08xxx (opsional)"
          />
          <div className="sm:col-span-2 lg:col-span-3 flex justify-end gap-3 pt-2">
            <Link href="/admin/guru">
              <Button type="button" variant="outline">Batal</Button>
            </Link>
            <Button type="submit" loading={saving}>
              {isEdit ? "Simpan Perubahan" : "Simpan Guru"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

export default function GuruFormPage() {
  return (
    <Suspense fallback={<Skeleton className="h-64 w-full" />}>
      <GuruFormInner />
    </Suspense>
  );
}
