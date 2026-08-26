"use client";

import { FormEvent, useEffect, useState } from "react";
import { api } from "@/lib/api";

interface Guru {
  id: number;
  nip: string | null;
  nama: string;
  no_hp: string | null;
  is_aktif: boolean;
  user: { email: string };
}

export default function GuruPage() {
  const [data, setData] = useState<Guru[]>([]);
  const [form, setForm] = useState({ nama: "", email: "", password: "", nip: "", no_hp: "" });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const res = await api.get<Guru[]>("/guru");
    setData(res.data);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await api.post("/guru", form);
      setForm({ nama: "", email: "", password: "", nip: "", no_hp: "" });
      load();
    } catch (err: any) {
      setError(err.response?.data?.message ?? "Gagal menyimpan guru.");
    }
  }

  return (
    <div>
      <h1 className="text-lg font-semibold">Data Guru Pesantren</h1>
      <p className="mt-1 text-sm text-gray-500">
        Menambahkan guru otomatis membuat akun login untuknya.
      </p>

      <form onSubmit={handleCreate} className="mt-4 grid max-w-xl gap-2">
        <input
          value={form.nama}
          onChange={(e) => setForm({ ...form, nama: e.target.value })}
          placeholder="Nama lengkap"
          required
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
        <input
          type="email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          placeholder="Email login"
          required
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
        <input
          type="password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          placeholder="Password awal (min 8 karakter)"
          required
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
        <input
          value={form.nip}
          onChange={(e) => setForm({ ...form, nip: e.target.value })}
          placeholder="NIP/NUPTK (opsional)"
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
        <button className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700">
          Tambah Guru
        </button>
      </form>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

      {loading ? (
        <p className="mt-6 text-sm text-gray-500">Memuat...</p>
      ) : (
        <table className="mt-6 w-full overflow-hidden rounded-xl border border-gray-200 bg-white text-sm">
          <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
            <tr>
              <th className="px-4 py-2">Nama</th>
              <th className="px-4 py-2">Email</th>
              <th className="px-4 py-2">NIP</th>
              <th className="px-4 py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {data.map((g) => (
              <tr key={g.id} className="border-t border-gray-100">
                <td className="px-4 py-2">{g.nama}</td>
                <td className="px-4 py-2">{g.user.email}</td>
                <td className="px-4 py-2">{g.nip ?? "-"}</td>
                <td className="px-4 py-2">{g.is_aktif ? "Aktif" : "Nonaktif"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
