"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import { Role, ROLE_LABELS } from "@/lib/types";
import {
  PageHeader, Card, Button, Input, Select, Table, TableHead, TableBody, Th, Td, TableRow,
  Badge, Skeleton, EmptyState, Modal, IconButton, Alert, Pagination,
} from "@/components/ui";

interface PenggunaRow {
  id: number;
  name: string;
  email: string;
  role: Role;
  identifier: string | null;
  is_active: boolean;
  guru: { nip: string | null } | null;
}

interface PaginatedPengguna {
  data?: PenggunaRow[];
  current_page?: number;
  last_page?: number;
  total?: number;
  from?: number | null;
  to?: number | null;
}

const ROLE_VARIANT: Record<Role, "success" | "warning" | "danger" | "info" | "default" | "purple"> = {
  admin: "danger",
  guru_pesantren: "info",
  wali_kelas: "purple",
  kepala_sekolah: "success",
  siswa: "default",
  orang_tua: "warning",
};

export default function PenggunaPage() {
  return (
    <Suspense fallback={<Skeleton className="h-64 w-full" />}>
      <Pengguna />
    </Suspense>
  );
}

function Pengguna() {
  const searchParams = useSearchParams();
  const fokusUserId = searchParams.get("user_id");

  const [data, setData] = useState<PenggunaRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState("");
  const [committedSearch, setCommittedSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ page: 1, lastPage: 1, total: 0, from: 0, to: 0 });

  const [error, setError] = useState<string | null>(null);
  const [edit, setEdit] = useState<PenggunaRow | null>(null);
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Penunjuk dari halaman lain (?user_id=) hanya dibuka sekali
  const fokusDitangani = useRef(false);

  const load = useCallback(() => {
    setLoading(true);
    api.get<PenggunaRow[] | PaginatedPengguna>("/user", {
      params: {
        page,
        search: committedSearch || undefined,
        role: roleFilter || undefined,
      },
    }).then((res) => {
      const payload = res.data;
      if (Array.isArray(payload)) {
        setData(payload);
        setMeta({ page: 1, lastPage: 1, total: payload.length, from: payload.length ? 1 : 0, to: payload.length });
        if (!fokusDitangani.current && fokusUserId) {
          const target = payload.find((u) => String(u.id) === fokusUserId);
          if (target) {
            setEdit(target);
            setForm({ name: target.name, email: target.email, password: "" });
            fokusDitangani.current = true;
          }
        }
      } else {
        const list = payload.data ?? [];
        setData(list);
        setMeta({
          page: payload.current_page ?? 1,
          lastPage: payload.last_page ?? 1,
          total: payload.total ?? list.length,
          from: payload.from ?? (list.length ? 1 : 0),
          to: payload.to ?? list.length,
        });
        if (!fokusDitangani.current && fokusUserId) {
          const target = list.find((u) => String(u.id) === fokusUserId);
          if (target) {
            setEdit(target);
            setForm({ name: target.name, email: target.email, password: "" });
            fokusDitangani.current = true;
          }
        }
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [page, committedSearch, roleFilter, fokusUserId]);

  useEffect(() => {
    load();
  }, [load]);

  function bukaEdit(u: PenggunaRow) {
    setEdit(u);
    setForm({ name: u.name, email: u.email, password: "" });
    setEditError(null);
  }

  async function simpan() {
    if (!edit) return;
    setSaving(true);
    setEditError(null);
    try {
      await api.put(`/user/${edit.id}`, {
        name: form.name,
        email: form.email,
        ...(form.password.trim() ? { password: form.password } : {}),
      });
      setEdit(null);
      await load();
    } catch (err: unknown) {
      const pesan = (err as { response?: { data?: { message?: string } } })?.response?.data;
      setEditError(pesan?.message ?? "Gagal menyimpan perubahan akun.");
    } finally {
      setSaving(false);
    }
  }

  async function toggleAktif(u: PenggunaRow) {
    setError(null);
    try {
      await api.put(`/user/${u.id}`, { is_active: !u.is_active });
      await load();
    } catch (err: unknown) {
      const pesan = (err as { response?: { data?: { message?: string } } })?.response?.data;
      setError(pesan?.message ?? "Gagal mengubah status akun.");
    }
  }

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Kelola Pengguna"
        description="Atur akun login seluruh pengguna — perbarui email dan password kapan pun."
      />

      {error && (
        <div className="mb-6">
          <Alert variant="danger" onClose={() => setError(null)}>{error}</Alert>
        </div>
      )}

      {/* Filter - Layout persis seperti Data Siswa */}
      <Card className="mb-5 sm:mb-6">
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <div className="flex-1">
            <Input
              placeholder="Cari nama, email, NIP, atau NIS…"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  setCommittedSearch(searchInput);
                  setPage(1);
                }
              }}
            />
          </div>
          <div className="w-full sm:w-52">
            <Select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="">Semua Role</option>
              {(Object.keys(ROLE_LABELS) as Role[]).map((r) => (
                <option key={r} value={r}>{ROLE_LABELS[r]}</option>
              ))}
            </Select>
          </div>
          <Button
            variant="outline"
            className="w-full sm:w-auto"
            onClick={() => {
              setCommittedSearch(searchInput);
              setPage(1);
            }}
          >
            Cari
          </Button>
        </div>
      </Card>

      {loading ? (
        <Skeleton className="h-64 w-full" />
      ) : data.length === 0 ? (
        <EmptyState
          title="Tidak ada pengguna"
          description={
            committedSearch || roleFilter
              ? "Tidak ada akun yang cocok dengan filter atau kata kunci pencarian."
              : "Belum ada akun pengguna."
          }
        />
      ) : (
        <Card className="p-0">
          <Table>
            <TableHead>
              <Th className="w-12">No</Th>
              <Th>Nama</Th>
              <Th>Email Login</Th>
              <Th>Role</Th>
              <Th>NIP/NIS</Th>
              <Th>Status</Th>
              <Th className="text-right">Aksi</Th>
            </TableHead>
            <TableBody>
              {data.map((u, i) => (
                <TableRow
                  key={u.id}
                  className={String(u.id) === fokusUserId ? "bg-emerald-500/5" : ""}
                >
                  <Td className="text-slate-400">{meta.from + i}</Td>
                  <Td>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-emerald-500/10 text-emerald-700 flex items-center justify-center text-sm font-semibold shrink-0">
                        {u.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-medium text-slate-800">{u.name}</span>
                    </div>
                  </Td>
                  <Td className="text-slate-500">{u.email}</Td>
                  <Td>
                    <Badge variant={ROLE_VARIANT[u.role]}>{ROLE_LABELS[u.role]}</Badge>
                  </Td>
                  <Td className="font-mono text-xs">
                    {u.guru?.nip ?? u.identifier ?? <span className="text-slate-400 font-sans">-</span>}
                  </Td>
                  <Td>
                    <button
                      onClick={() => toggleAktif(u)}
                      title="Klik untuk mengubah status"
                      className="cursor-pointer"
                    >
                      <Badge variant={u.is_active ? "success" : "default"}>
                        {u.is_active ? "Aktif" : "Nonaktif"}
                      </Badge>
                    </button>
                  </Td>
                  <Td className="text-right">
                    <IconButton
                      icon="edit"
                      variant="edit"
                      label="Kelola akun"
                      onClick={() => bukaEdit(u)}
                    />
                  </Td>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Pagination */}
          <Pagination
            page={meta.page}
            lastPage={meta.lastPage}
            total={meta.total}
            from={meta.from}
            to={meta.to}
            label="pengguna"
            onPageChange={setPage}
          />
        </Card>
      )}

      <Modal
        open={edit !== null}
        onClose={() => setEdit(null)}
        title={`Kelola Akun: ${edit?.name ?? ""}`}
        description="Perubahan email/password berlaku untuk login berikutnya."
        footer={
          <>
            <Button type="button" variant="outline" onClick={() => setEdit(null)}>Batal</Button>
            <Button type="button" onClick={simpan} loading={saving}>Simpan</Button>
          </>
        }
      >
        {editError && <div className="mb-4"><Alert variant="danger" onClose={() => setEditError(null)}>{editError}</Alert></div>}
        <div className="space-y-4">
          <Input
            label="Nama"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
          <Input
            label="Email Login"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
          />
          <Input
            label="Password Baru"
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            placeholder="Biarkan kosong jika tidak diganti"
            hint="Minimal 8 karakter. Mengganti password akan mengeluarkan akun dari semua perangkat."
            autoComplete="new-password"
          />
          {edit?.role === "guru_pesantren" && (
            <p className="text-xs text-slate-400">
              Akun guru — nama profil guru ikut diperbarui otomatis saat nama diubah.
            </p>
          )}
        </div>
      </Modal>
    </div>
  );
}
