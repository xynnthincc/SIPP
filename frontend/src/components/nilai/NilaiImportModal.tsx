"use client";

import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import { Alert, Button, Modal } from "@/components/ui";

interface Ringkasan {
  mapel: number;
  siswa: number;
  nilai_terisi: number;
  nilai_kosong: number;
}

export interface HasilImportNilai {
  dry_run: boolean;
  message?: string;
  ringkasan: Ringkasan;
}

interface Props {
  open: boolean;
  onClose: () => void;
  semesterId: number | null;
  kelasId: number | null;
  kelasNama: string;
  onSelesai: () => void;
}

export function NilaiImportModal({ open, onClose, semesterId, kelasId, kelasNama, onSelesai }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [memproses, setMemproses] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detailError, setDetailError] = useState<string[]>([]);
  const [hasil, setHasil] = useState<HasilImportNilai | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setFile(null);
    setMemproses(false);
    setError(null);
    setDetailError([]);
    setHasil(null);
    if (inputRef.current) inputRef.current.value = "";
  }, [open]);

  function tutup() {
    if (memproses) return;
    onClose();
  }

  async function kirim(dryRun: boolean) {
    if (!file) {
      setError("Pilih file Excel (.xlsx) terlebih dahulu.");
      return;
    }
    if (!semesterId || !kelasId) {
      setError("Pilih semester dan kelas terlebih dahulu.");
      return;
    }

    setMemproses(true);
    setError(null);
    setDetailError([]);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("semester_id", String(semesterId));
      form.append("kelas_rombel_id", String(kelasId));
      if (dryRun) form.append("dry_run", "1");

      const res = await api.post<HasilImportNilai>("/nilai-diniyah/import", form, {
        headers: { "Content-Type": undefined },
      });
      setHasil(res.data);
      if (!dryRun) onSelesai();
    } catch (err: unknown) {
      const body = (err as { response?: { data?: { message?: string; errors?: string[] } } })?.response?.data;
      setError(body?.message ?? "Gagal memproses file. Pastikan memakai template import nilai.");
      setDetailError(Array.isArray(body?.errors) ? body.errors : []);
      setHasil(null);
    } finally {
      setMemproses(false);
    }
  }

  const r = hasil?.ringkasan;

  return (
    <Modal
      open={open}
      onClose={tutup}
      title="Import Nilai Excel"
      description={`Kelas ${kelasNama}. Import hanya mengubah kolom mapel yang ada di file dan yang menjadi hak akses Anda.`}
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
            title={hasil ? "Tulis nilai ke database" : "Lakukan Pratinjau terlebih dahulu"}
          >
            Import Sekarang
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {error && (
          <Alert variant="danger" onClose={() => { setError(null); setDetailError([]); }}>
            <div className="space-y-1">
              <p>{error}</p>
              {detailError.length > 0 && (
                <ul className="list-disc pl-4 space-y-0.5">
                  {detailError.map((e, i) => <li key={i}>{e}</li>)}
                </ul>
              )}
            </div>
          </Alert>
        )}

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
              setDetailError([]);
            }}
            className="block w-full text-sm text-slate-600 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 file:cursor-pointer cursor-pointer glass-input px-2 py-1.5"
          />
          {file && (
            <p className="text-xs text-slate-400 mt-1.5">
              {file.name} · {(file.size / 1024).toFixed(0)} KB
            </p>
          )}
        </div>

        <div className="rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-3 text-xs text-amber-800 leading-relaxed">
          Gunakan tombol <b>Template Excel</b> di halaman input nilai, isi nilainya, lalu unggah di sini.
          Sel kosong akan mengosongkan nilai pada mapel tersebut. Data NIS dan nama jangan diubah.
        </div>

        {r && (
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-sm font-semibold text-slate-800 mb-2">
              {hasil?.dry_run ? "Pratinjau import" : "Import selesai"}
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div><span className="text-slate-500">Mapel</span><p className="font-bold text-slate-800">{r.mapel}</p></div>
              <div><span className="text-slate-500">Siswa</span><p className="font-bold text-slate-800">{r.siswa}</p></div>
              <div><span className="text-slate-500">Nilai terisi</span><p className="font-bold text-emerald-700">{r.nilai_terisi}</p></div>
              <div><span className="text-slate-500">Nilai kosong</span><p className="font-bold text-slate-600">{r.nilai_kosong}</p></div>
            </div>
            {hasil?.dry_run && (
              <p className="text-xs text-slate-500 mt-2.5">
                Belum ada yang disimpan. Klik <b>Import Sekarang</b> untuk menulis nilai ke database.
              </p>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}
