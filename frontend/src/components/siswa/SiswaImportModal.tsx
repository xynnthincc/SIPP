"use client";

import { useRef, useState } from "react";
import { api } from "@/lib/api";
import { Alert, Button, Modal } from "@/components/ui";

interface Ringkasan {
  baris_valid: number;
  insert_nipd: number;
  insert_nisn: number;
  update_nipd: number;
  update_nama: number;
  tidak_disentuh: number;
  total_insert: number;
  total_update: number;
  rombel_tak_dikenal: string[];
  tanpa_rombel: number;
  duplikat_file: number;
  dilewati: number;
  tahun_ajaran: string;
}

interface HasilImport {
  dry_run: boolean;
  ringkasan: Ringkasan;
  peringatan: string[];
  hasil?: { insert: number; update: number };
}

interface Props {
  open: boolean;
  onClose: () => void;
  /** Dipanggil setelah import sukses (bukan dry-run) agar list di-reload. */
  onSelesai: () => void;
}

function MetrikBaris({ label, nilai, tone = "default" }: { label: string; nilai: string | number; tone?: "default" | "success" | "info" | "warning" }) {
  const warna =
    tone === "success" ? "text-emerald-700"
    : tone === "info" ? "text-blue-700"
    : tone === "warning" ? "text-amber-700"
    : "text-slate-800";
  return (
    <div className="flex items-center justify-between gap-4 px-3 py-2 rounded-lg bg-slate-50 border border-slate-100">
      <span className="text-xs text-slate-500">{label}</span>
      <span className={`text-sm font-semibold ${warna}`}>{nilai}</span>
    </div>
  );
}

export function SiswaImportModal({ open, onClose, onSelesai }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [memproses, setMemproses] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasil, setHasil] = useState<HasilImport | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function reset() {
    setFile(null);
    setHasil(null);
    setError(null);
    setMemproses(false);
    if (inputRef.current) inputRef.current.value = "";
  }

  function tutup() {
    reset();
    onClose();
  }

  async function kirim(dryRun: boolean) {
    if (!file) {
      setError("Pilih file Excel (.xlsx) terlebih dahulu.");
      return;
    }
    setMemproses(true);
    setError(null);
    try {
      const form = new FormData();
      form.append("file", file);
      if (dryRun) form.append("dry_run", "1");

      const res = await api.post<HasilImport>("/siswa/import", form, {
        // Biarkan browser menetapkan multipart/form-data + boundary sendiri
        headers: { "Content-Type": undefined },
      });
      setHasil(res.data);

      if (!dryRun) {
        onSelesai();
      }
    } catch (err: unknown) {
      const pesan = (err as { response?: { data?: { message?: string } } })?.response?.data;
      setError(pesan?.message ?? "Gagal memproses file. Pastikan format sesuai ekspor e-rapor.");
    } finally {
      setMemproses(false);
    }
  }

  const r = hasil?.ringkasan;

  return (
    <Modal
      open={open}
      onClose={tutup}
      title="Import Data Siswa"
      description='Unggah file .xlsx hasil ekspor e-rapor "Daftar Peserta Didik per Kelas" (sheet "Semua Siswa").'
      maxWidth="lg"
      footer={
        <>
          <Button variant="outline" onClick={tutup} disabled={memproses}>
            {hasil && !hasil.dry_run ? "Tutup" : "Batal"}
          </Button>
          <Button
            variant="outline"
            onClick={() => kirim(true)}
            loading={memproses && !hasil}
            disabled={!file || memproses}
          >
            Pratinjau
          </Button>
          <Button
            onClick={() => kirim(false)}
            loading={memproses && !!hasil}
            disabled={!file || memproses || !hasil}
            title={hasil ? "Tulis ke database" : "Lakukan Pratinjau terlebih dahulu"}
          >
            Import Sekarang
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {error && <Alert variant="danger" onClose={() => setError(null)}>{error}</Alert>}

        {/* Pilih file */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">File Excel</label>
          <input
            ref={inputRef}
            type="file"
            accept=".xlsx,.xls"
            onChange={(e) => {
              setFile(e.target.files?.[0] ?? null);
              setHasil(null);
              setError(null);
            }}
            className="block w-full text-sm text-slate-600 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 file:cursor-pointer cursor-pointer glass-input px-2 py-1.5"
          />
          {file && (
            <p className="text-xs text-slate-400 mt-1.5">
              {file.name} · {(file.size / 1024).toFixed(0)} KB
            </p>
          )}
        </div>

        <div className="p-3 rounded-xl bg-blue-50 border border-blue-100 text-xs text-blue-700 leading-relaxed">
          Siswa yang <b>NIPD-nya sudah ada</b> akan <b>diperbarui</b>, yang baru akan <b>ditambahkan</b>,
          dan kelas diambil dari kolom rombel (mis. <span className="font-mono">7-A</span>) sesuai
          <b> tahun ajaran aktif</b>. Siswa lama yang tidak ada di file tidak diubah. Selalu jalankan
          <b> Pratinjau</b> dulu sebelum menyimpan.
        </div>

        {/* Hasil */}
        {r && (
          <div className="space-y-3">
            <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-medium ${
              hasil.dry_run ? "bg-amber-50 border-amber-200 text-amber-700" : "bg-emerald-50 border-emerald-200 text-emerald-700"
            }`}>
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                {hasil.dry_run ? (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m0 3.75h.007v.008H12v-.008z M12 3l9 16.5H3L12 3z" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                )}
              </svg>
              {hasil.dry_run
                ? `Pratinjau (belum disimpan) · ${r.baris_valid} baris terbaca · TA ${r.tahun_ajaran}`
                : `Selesai · ${hasil.hasil?.insert ?? 0} ditambahkan, ${hasil.hasil?.update ?? 0} diperbarui`}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <MetrikBaris label="Siswa baru ditambahkan" nilai={r.insert_nipd + r.insert_nisn} tone="success" />
              <MetrikBaris label="Siswa diperbarui" nilai={r.update_nipd + r.update_nama} tone="info" />
              <MetrikBaris label="Lewat NIPD (update)" nilai={r.update_nipd} />
              <MetrikBaris label="Lewat nama+JK (update)" nilai={r.update_nama} />
              <MetrikBaris label="Siswa lama tak diubah" nilai={r.tidak_disentuh} />
              <MetrikBaris label="Tanpa rombel di file" nilai={r.tanpa_rombel} tone={r.tanpa_rombel ? "warning" : "default"} />
            </div>

            {r.rombel_tak_dikenal.length > 0 && (
              <Alert variant="warning">
                Rombel <b>{r.rombel_tak_dikenal.join(", ")}</b> belum ada di tahun ajaran aktif —
                siswa tersebut masuk <b>tanpa kelas</b>. Buat kelasnya dulu, lalu edit siswa atau jalankan ulang import.
              </Alert>
            )}

            {hasil.peringatan.length > 0 && (
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <p className="text-xs font-semibold text-slate-600 mb-1.5">Catatan ({r.duplikat_file + r.dilewati} baris dilewati)</p>
                <ul className="space-y-0.5 max-h-32 overflow-y-auto">
                  {hasil.peringatan.map((p, i) => (
                    <li key={i} className="text-xs text-slate-500">• {p}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}
