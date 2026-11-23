"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import {
  PageHeader, Card, Button, Select, Skeleton, ConfirmModal, IconButton, Alert, EmptyState, Modal,
} from "@/components/ui";

interface Semester {
  id: number;
  nama: "Ganjil" | "Genap";
  jenis: "Akhir" | "Sementara";
  is_aktif: boolean;
  penilaian_dibuka: boolean;
}

interface TahunAjaran {
  id: number;
  nama: string;
  is_aktif: boolean;
  semesters: Semester[];
}

function TogglePill({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors cursor-pointer ${
        active
          ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
          : "bg-slate-50 text-slate-400 border-slate-200 hover:bg-slate-100 hover:text-slate-600"
      }`}
    >
      {label}
    </button>
  );
}

export default function TahunAjaranPage() {
  const router = useRouter();
  const [data, setData] = useState<TahunAjaran[]>([]);
  const [loading, setLoading] = useState(true);
  const [hapusTA, setHapusTA] = useState<TahunAjaran | null>(null);
  const [hapusSemester, setHapusSemester] = useState<{ ta: TahunAjaran; semester: Semester } | null>(null);
  const [hapusLoading, setHapusLoading] = useState(false);
  const [hapusError, setHapusError] = useState<string | null>(null);
  const [promosiTA, setPromosiTA] = useState<TahunAjaran | null>(null);
  const [promosiTujuan, setPromosiTujuan] = useState("");
  const [promosiLoading, setPromosiLoading] = useState(false);
  const [promosiError, setPromosiError] = useState<string | null>(null);
  const [promosiHasil, setPromosiHasil] = useState<string | null>(null);

  const load = useCallback(() => {
    api.get<TahunAjaran[]>("/tahun-ajaran").then((res) => {
      setData(res.data);
      setLoading(false);
    });
  }, []);

  useEffect(() => { load(); }, [load]);

  async function toggleAktif(item: TahunAjaran) {
    await api.put(`/tahun-ajaran/${item.id}`, { is_aktif: !item.is_aktif });
    await load();
  }

  async function toggleSemester(semester: Semester, field: "is_aktif" | "penilaian_dibuka") {
    await api.put(`/semester/${semester.id}`, { [field]: !semester[field] });
    await load();
  }

  async function tambahSemester(ta: TahunAjaran, nama: "Ganjil" | "Genap", jenis: "Akhir" | "Sementara") {
    try {
      await api.post("/semester", { tahun_ajaran_id: ta.id, nama, jenis });
      await load();
    } catch (err: unknown) {
      const pesan = (err as { response?: { data?: { message?: string } } })?.response?.data;
      setHapusError(pesan?.message ?? `Gagal menambahkan semester ${nama}.`);
    }
  }

  async function handleHapusTA() {
    if (!hapusTA) return;
    setHapusLoading(true);
    setHapusError(null);
    try {
      await api.delete(`/tahun-ajaran/${hapusTA.id}`);
      setHapusTA(null);
      await load();
    } catch (err: unknown) {
      const pesan = (err as { response?: { data?: { message?: string } } })?.response?.data;
      setHapusError(pesan?.message ?? "Gagal menghapus tahun ajaran.");
    } finally {
      setHapusLoading(false);
    }
  }

  async function handleHapusSemester() {
    if (!hapusSemester) return;
    setHapusLoading(true);
    setHapusError(null);
    try {
      await api.delete(`/semester/${hapusSemester.semester.id}`);
      setHapusSemester(null);
      await load();
    } catch (err: unknown) {
      const pesan = (err as { response?: { data?: { message?: string } } })?.response?.data;
      setHapusError(pesan?.message ?? "Gagal menghapus semester.");
    } finally {
      setHapusLoading(false);
    }
  }

  async function handlePromosi() {
    if (!promosiTA || !promosiTujuan) return;
    setPromosiLoading(true);
    setPromosiError(null);
    try {
      const res = await api.post<{ naik: number; lulus: number; tahun_ajaran_tujuan: string }>(
        `/tahun-ajaran/${promosiTA.id}/promosi`,
        { tahun_ajaran_tujuan_id: Number(promosiTujuan) }
      );
      setPromosiHasil(
        `${res.data.naik} siswa naik kelas & ${res.data.lulus} siswa tingkat 9 (lulus) di TA ${res.data.tahun_ajaran_tujuan}. Riwayat kelas & nilai semester TA lama tetap tersimpan.`
      );
      setPromosiTA(null);
      await load();
    } catch (err: unknown) {
      const pesan = (err as { response?: { data?: { message?: string } } })?.response?.data;
      setPromosiError(pesan?.message ?? "Gagal mempromosikan siswa.");
    } finally {
      setPromosiLoading(false);
    }
  }

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Tahun Ajaran & Semester"
        description="Atur tahun ajaran dan periode penilaian."
        action={<Button onClick={() => router.push("/admin/tahun-ajaran/form")}>+ Tambah Tahun Ajaran</Button>}
      />

      {hapusError && (
        <div className="mb-6">
          <Alert variant="danger" onClose={() => setHapusError(null)}>{hapusError}</Alert>
        </div>
      )}
      {promosiHasil && (
        <div className="mb-6">
          <Alert variant="success" onClose={() => setPromosiHasil(null)}>{promosiHasil}</Alert>
        </div>
      )}

      {loading ? (
        <Skeleton className="h-40 w-full" />
      ) : data.length === 0 ? (
        <EmptyState
          title="Belum ada tahun ajaran"
          description="Tambahkan tahun ajaran untuk mulai mengelola kelas dan penilaian."
          action={<Button onClick={() => router.push("/admin/tahun-ajaran/form")}>+ Tambah Tahun Ajaran</Button>}
        />
      ) : (
        <div className="space-y-4">
          {data.map((ta) => (
            <Card key={ta.id}>
              <div className="flex items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-3">
                  <h3 className="text-lg font-semibold text-slate-800">{ta.nama}</h3>
                  <TogglePill
                    active={ta.is_aktif}
                    onClick={() => toggleAktif(ta)}
                    label={ta.is_aktif ? "Aktif" : "Nonaktif"}
                  />
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setPromosiTA(ta);
                      setPromosiTujuan("");
                      setPromosiError(null);
                    }}
                  >
                    Naik Kelas
                  </Button>
                  <IconButton icon="edit" variant="edit" label="Edit tahun ajaran" onClick={() => router.push(`/admin/tahun-ajaran/form?id=${ta.id}`)} />
                  <IconButton icon="trash" variant="delete" label="Hapus tahun ajaran" onClick={() => { setHapusTA(ta); setHapusError(null); }} />
                </div>
              </div>

              <div className="space-y-2">
                {ta.semesters?.map((s) => (
                  <div
                    key={s.id}
                    className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl bg-slate-50/70 border border-slate-100"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-slate-700">Semester {s.nama}</span>
                      {s.jenis === "Sementara" ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                          Sementara
                        </span>
                      ) : null}
                    </div>
                    <div className="flex items-center gap-2">
                      <TogglePill
                        active={s.is_aktif}
                        onClick={() => toggleSemester(s, "is_aktif")}
                        label={s.is_aktif ? "Berjalan" : "Nonaktif"}
                      />
                      <TogglePill
                        active={s.penilaian_dibuka}
                        onClick={() => toggleSemester(s, "penilaian_dibuka")}
                        label={s.penilaian_dibuka ? "Penilaian Dibuka" : "Penilaian Ditutup"}
                      />
                      <IconButton
                        icon="trash"
                        variant="delete"
                        label="Hapus semester"
                        onClick={() => { setHapusSemester({ ta, semester: s }); setHapusError(null); }}
                      />
                    </div>
                  </div>
                ))}

                {/* Kombinasi semester yang belum ada bisa ditambahkan manual:
                    Ganjil/Genap × Akhir/Sementara (wadah rapor tengah semester punya nilai terpisah) */}
                {(["Ganjil", "Genap"] as const).flatMap((n) =>
                  (["Akhir", "Sementara"] as const)
                    .filter((j) => !ta.semesters?.some((s) => s.nama === n && s.jenis === j))
                    .map((j) => (
                      <button
                        key={`${n}-${j}`}
                        onClick={() => tambahSemester(ta, n, j)}
                        className="w-full flex items-center justify-center gap-2 p-3 rounded-xl border border-dashed border-slate-200 text-sm text-slate-400 hover:text-emerald-700 hover:border-emerald-300 hover:bg-emerald-50/40 transition-colors cursor-pointer"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                        </svg>
                        Tambah Semester {n}{j === "Sementara" ? " (Sementara)" : ""}
                      </button>
                    ))
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      <ConfirmModal
        open={hapusTA !== null}
        onClose={() => setHapusTA(null)}
        onConfirm={handleHapusTA}
        loading={hapusLoading}
        title="Hapus Tahun Ajaran"
        message={`Yakin ingin menghapus tahun ajaran "${hapusTA?.nama}" beserta semesternya?`}
      />
      <ConfirmModal
        open={hapusSemester !== null}
        onClose={() => setHapusSemester(null)}
        onConfirm={handleHapusSemester}
        loading={hapusLoading}
        title="Hapus Semester"
        message={`Yakin ingin menghapus semester ${hapusSemester?.semester.nama}${hapusSemester?.semester.jenis === "Sementara" ? " (Sementara)" : ""} dari tahun ajaran ${hapusSemester?.ta.nama}?`}
      />

      {/* Modal promosi kenaikan kelas antar tahun ajaran */}
      {promosiTA && (
        <Modal
          open={promosiTA !== null}
          onClose={() => {
            if (!promosiLoading) {
              setPromosiTA(null);
              setPromosiError(null);
            }
          }}
          title={`Naik Kelas — ${promosiTA.nama}`}
          description="Pindahkan seluruh siswa aktif ke kelas tingkat berikutnya pada tahun ajaran tujuan."
          maxWidth="sm"
          footer={
            <>
              <Button
                type="button"
                variant="outline"
                disabled={promosiLoading}
                onClick={() => {
                  setPromosiTA(null);
                  setPromosiError(null);
                }}
              >
                Batal
              </Button>
              <Button
                onClick={handlePromosi}
                loading={promosiLoading}
                disabled={!promosiTujuan || data.filter((t) => t.id !== promosiTA.id).length === 0}
              >
                Promosikan Siswa
              </Button>
            </>
          }
        >
          <div className="space-y-4 text-sm">
            {promosiError && (
              <Alert variant="danger" onClose={() => setPromosiError(null)}>
                {promosiError}
              </Alert>
            )}

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70 text-xs text-slate-600 space-y-2">
              <span className="font-semibold text-slate-700 block">Ketentuan Kenaikan:</span>
              <ul className="space-y-1.5 pl-4 list-disc marker:text-slate-400 leading-relaxed text-slate-600">
                <li>
                  <strong className="text-slate-800 font-semibold">Kelas 7 & 8:</strong> Naik ke tingkat berikutnya (contoh: 7A &rarr; 8A). Rombel otomatis dibuat bila belum ada di TA tujuan.
                </li>
                <li>
                  <strong className="text-slate-800 font-semibold">Kelas 9:</strong> Ditetapkan lulus dan tidak dipindahkan ke rombel baru.
                </li>
                <li>
                  <strong className="text-slate-800 font-semibold">Riwayat & Nilai:</strong> Data penempatan kelas lama, nilai semester, dan rapor di TA {promosiTA.nama} tetap aman tersimpan.
                </li>
              </ul>
            </div>

            {data.filter((t) => t.id !== promosiTA.id).length > 0 ? (
              <Select
                label="Tahun Ajaran Tujuan"
                value={promosiTujuan}
                onChange={(e) => {
                  setPromosiTujuan(e.target.value);
                  setPromosiError(null);
                }}
                placeholder="Pilih tahun ajaran tujuan"
                required
              >
                {data.filter((t) => t.id !== promosiTA.id).map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.nama}
                  </option>
                ))}
              </Select>
            ) : (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800">
                Belum ada tahun ajaran tujuan. Tambahkan tahun ajaran baru terlebih dahulu.
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}