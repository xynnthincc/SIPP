"use client";

import { FormEvent, Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import { PageHeader, Card, Button, Input, Select, Skeleton, Alert } from "@/components/ui";

interface SiswaDetail {
  id: number;
  nis: string;
  nama: string;
  jenis_kelamin: "L" | "P";
  kelas_rombel: { id: number; nama: string } | null;
  tempat_lahir?: string | null;
  tanggal_lahir?: string | null;
  alamat?: string | null;
  agama?: string | null;
  sekolah_asal?: string | null;
  nama_ayah?: string | null;
  no_wa_ayah?: string | null;
  profesi_ayah?: string | null;
  nama_ibu?: string | null;
  no_telp_ibu?: string | null;
  profesi_ibu?: string | null;
  status_anak?: string | null;
  anak_ke?: string | null;
  no_telp?: string | null;
  nama_wali?: string | null;
  pekerjaan_wali?: string | null;
  alamat_wali?: string | null;
  no_telp_wali?: string | null;
}

interface KelasOption {
  id: number;
  nama: string;
}

const emptyForm = {
  nis: "",
  nama: "",
  jenis_kelamin: "L",
  kelas_rombel_id: "",
  tempat_lahir: "",
  tanggal_lahir: "",
  alamat: "",
  agama: "",
  sekolah_asal: "",
  nama_ayah: "",
  no_wa_ayah: "",
  profesi_ayah: "",
  nama_ibu: "",
  no_telp_ibu: "",
  profesi_ibu: "",
  status_anak: "",
  anak_ke: "",
  no_telp: "",
  nama_wali: "",
  pekerjaan_wali: "",
  alamat_wali: "",
  no_telp_wali: "",
};

export default function SiswaFormPage() {
  return (
    <Suspense fallback={<Skeleton className="h-64 w-full" />}>
      <SiswaForm />
    </Suspense>
  );
}

function SiswaForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const idParam = searchParams.get("id");
  const isEdit = !!idParam;

  const [form, setForm] = useState(emptyForm);
  const [kelasList, setKelasList] = useState<KelasOption[]>([]);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.get<KelasOption[]>("/kelas-rombel").then((res) => setKelasList(res.data));
  }, []);

  const load = useCallback(() => {
    api.get<SiswaDetail>(`/siswa/${idParam}`).then((res) => {
      const s = res.data;
      setForm({
        nis: s.nis,
        nama: s.nama,
        jenis_kelamin: s.jenis_kelamin,
        kelas_rombel_id: s.kelas_rombel?.id ? String(s.kelas_rombel.id) : "",
        tempat_lahir: s.tempat_lahir ?? "",
        tanggal_lahir: s.tanggal_lahir ?? "",
        alamat: s.alamat ?? "",
        agama: s.agama ?? "",
        sekolah_asal: s.sekolah_asal ?? "",
        nama_ayah: s.nama_ayah ?? "",
        no_wa_ayah: s.no_wa_ayah ?? "",
        profesi_ayah: s.profesi_ayah ?? "",
        nama_ibu: s.nama_ibu ?? "",
        no_telp_ibu: s.no_telp_ibu ?? "",
        profesi_ibu: s.profesi_ibu ?? "",
        status_anak: s.status_anak ?? "",
        anak_ke: s.anak_ke ?? "",
        no_telp: s.no_telp ?? "",
        nama_wali: s.nama_wali ?? "",
        pekerjaan_wali: s.pekerjaan_wali ?? "",
        alamat_wali: s.alamat_wali ?? "",
        no_telp_wali: s.no_telp_wali ?? "",
      });
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
      const body: Record<string, string | number | null> = {
        nama: form.nama,
        jenis_kelamin: form.jenis_kelamin,
        kelas_rombel_id: form.kelas_rombel_id || null,
        tempat_lahir: form.tempat_lahir || null,
        tanggal_lahir: form.tanggal_lahir || null,
        alamat: form.alamat || null,
        agama: form.agama || null,
        sekolah_asal: form.sekolah_asal || null,
        nama_ayah: form.nama_ayah || null,
        no_wa_ayah: form.no_wa_ayah || null,
        profesi_ayah: form.profesi_ayah || null,
        nama_ibu: form.nama_ibu || null,
        no_telp_ibu: form.no_telp_ibu || null,
        profesi_ibu: form.profesi_ibu || null,
        status_anak: form.status_anak || null,
        anak_ke: form.anak_ke || null,
        no_telp: form.no_telp || null,
        nama_wali: form.nama_wali || null,
        pekerjaan_wali: form.pekerjaan_wali || null,
        alamat_wali: form.alamat_wali || null,
        no_telp_wali: form.no_telp_wali || null,
      };
      if (isEdit) {
        await api.put(`/siswa/${idParam}`, body);
      } else {
        await api.post("/siswa", { ...body, nis: form.nis });
      }
      router.push("/admin/siswa");
    } catch (err: unknown) {
      const pesan = (err as { response?: { data?: { message?: string } } })?.response?.data;
      setError(pesan?.message ?? "Gagal menyimpan siswa.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={isEdit ? "Edit Siswa" : "Tambah Siswa"}
        description={isEdit ? "Perbarui data siswa." : "Siswa baru akan masuk ke daftar kelas terpilih."}
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
          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Input
              label="NIS"
              value={form.nis}
              onChange={(e) => setForm({ ...form, nis: e.target.value })}
              placeholder="Nomor Induk Siswa"
              required
              disabled={isEdit}
              hint={isEdit ? "NIS tidak dapat diubah" : undefined}
            />
            <Input
              label="Nama Lengkap"
              value={form.nama}
              onChange={(e) => setForm({ ...form, nama: e.target.value })}
              placeholder="Nama siswa"
              required
            />
            <Select
              label="Jenis Kelamin"
              value={form.jenis_kelamin}
              onChange={(e) => setForm({ ...form, jenis_kelamin: e.target.value })}
            >
              <option value="L">Laki-laki</option>
              <option value="P">Perempuan</option>
            </Select>
            <Select
              label="Kelas"
              value={form.kelas_rombel_id}
              onChange={(e) => setForm({ ...form, kelas_rombel_id: e.target.value })}
            >
              <option value="">Belum ada kelas</option>
              {kelasList.map((k) => (
                <option key={k.id} value={k.id}>{k.nama}</option>
              ))}
            </Select>
            <p className="sm:col-span-2 lg:col-span-3 text-xs font-semibold uppercase tracking-wider text-slate-400 pt-2 border-t border-slate-100">Data Kependudukan</p>
            <Input
              label="Tempat Lahir"
              value={form.tempat_lahir}
              onChange={(e) => setForm({ ...form, tempat_lahir: e.target.value })}
              placeholder="Tempat lahir siswa"
            />
            <Input
              label="Tanggal Lahir"
              type="date"
              value={form.tanggal_lahir}
              onChange={(e) => setForm({ ...form, tanggal_lahir: e.target.value })}
            />
            <Select
              label="Agama"
              value={form.agama}
              onChange={(e) => setForm({ ...form, agama: e.target.value })}
            >
              <option value="">Pilih agama</option>
              <option value="Islam">Islam</option>
              <option value="Kristen">Kristen</option>
              <option value="Katolik">Katolik</option>
              <option value="Hindu">Hindu</option>
              <option value="Buddha">Buddha</option>
              <option value="Konghucu">Konghucu</option>
            </Select>
            <Input
              label="Sekolah Asal"
              value={form.sekolah_asal}
              onChange={(e) => setForm({ ...form, sekolah_asal: e.target.value })}
              placeholder="Asal sekolah / madrasah"
            />
            <div className="sm:col-span-2 lg:col-span-3">
              <Input
                label="Alamat"
                value={form.alamat}
                onChange={(e) => setForm({ ...form, alamat: e.target.value })}
                placeholder="Alamat lengkap tempat tinggal"
              />
            </div>
            <p className="sm:col-span-2 lg:col-span-3 text-xs font-semibold uppercase tracking-wider text-slate-400 pt-2 border-t border-slate-100">Data Ayah</p>
            <Input
              label="Nama Ayah"
              value={form.nama_ayah}
              onChange={(e) => setForm({ ...form, nama_ayah: e.target.value })}
              placeholder="Nama ayah"
            />
            <Input
              label="No. WA Ayah"
              value={form.no_wa_ayah}
              onChange={(e) => setForm({ ...form, no_wa_ayah: e.target.value })}
              placeholder="Nomor WhatsApp ayah"
            />
            <Input
              label="Profesi Ayah"
              value={form.profesi_ayah}
              onChange={(e) => setForm({ ...form, profesi_ayah: e.target.value })}
              placeholder="Pekerjaan ayah"
            />
            <p className="sm:col-span-2 lg:col-span-3 text-xs font-semibold uppercase tracking-wider text-slate-400 pt-2 border-t border-slate-100">Data Ibu</p>
            <Input
              label="Nama Ibu"
              value={form.nama_ibu}
              onChange={(e) => setForm({ ...form, nama_ibu: e.target.value })}
              placeholder="Nama ibu"
            />
            <Input
              label="No. Telp Ibu"
              value={form.no_telp_ibu}
              onChange={(e) => setForm({ ...form, no_telp_ibu: e.target.value })}
              placeholder="Nomor telepon ibu"
            />
            <Input
              label="Profesi Ibu"
              value={form.profesi_ibu}
              onChange={(e) => setForm({ ...form, profesi_ibu: e.target.value })}
              placeholder="Pekerjaan ibu"
            />
            <p className="sm:col-span-2 lg:col-span-3 text-xs font-semibold uppercase tracking-wider text-slate-400 pt-2 border-t border-slate-100">Data Tambahan</p>
            <Select
              label="Status Anak"
              value={form.status_anak}
              onChange={(e) => setForm({ ...form, status_anak: e.target.value })}
            >
              <option value="">Pilih status</option>
              <option value="Kandung">Kandung</option>
              <option value="Tiri">Tiri</option>
              <option value="Angkat">Angkat</option>
            </Select>
            <Input
              label="Anak Ke"
              value={form.anak_ke}
              onChange={(e) => setForm({ ...form, anak_ke: e.target.value })}
              placeholder="Anak ke berapa"
            />
            <Input
              label="No. Telp (Hp Siswa)"
              value={form.no_telp}
              onChange={(e) => setForm({ ...form, no_telp: e.target.value })}
              placeholder="Nomor HP siswa"
            />
            <p className="sm:col-span-2 lg:col-span-3 text-xs font-semibold uppercase tracking-wider text-slate-400 pt-2 border-t border-slate-100">Data Wali</p>
            <Input
              label="Nama Wali"
              value={form.nama_wali}
              onChange={(e) => setForm({ ...form, nama_wali: e.target.value })}
              placeholder="Nama wali"
            />
            <Input
              label="Pekerjaan Wali"
              value={form.pekerjaan_wali}
              onChange={(e) => setForm({ ...form, pekerjaan_wali: e.target.value })}
              placeholder="Pekerjaan wali"
            />
            <div className="sm:col-span-2 lg:col-span-3">
              <Input
                label="Alamat Wali"
                value={form.alamat_wali}
                onChange={(e) => setForm({ ...form, alamat_wali: e.target.value })}
                placeholder="Alamat wali"
              />
            </div>
            <Input
              label="No. Telp Wali"
              value={form.no_telp_wali}
              onChange={(e) => setForm({ ...form, no_telp_wali: e.target.value })}
              placeholder="Nomor telepon wali"
            />
            <div className="sm:col-span-2 lg:col-span-3 flex justify-end gap-3 pt-4 border-t border-slate-100">
              <Link href="/admin/siswa">
                <Button type="button" variant="outline">Batal</Button>
              </Link>
              <Button type="submit" loading={saving}>
                {isEdit ? "Simpan Perubahan" : "Simpan Siswa"}
              </Button>
            </div>
          </form>
        </Card>
      )}
    </div>
  );
}
