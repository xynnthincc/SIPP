"use client";

import { ReactNode, useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { PageHeader, Card, Button, Badge, Skeleton, EmptyState, Pagination } from "@/components/ui";

interface Rapor {
  id: number;
  status: string;
  catatan_wali_kelas: string | null;
  siswa: { nis: string; nama: string; kelas_rombel: { nama: string } | null };
}

const PER_HALAMAN = 8;

function HalamanRapor({ items, children }: { items: Rapor[]; children: (items: Rapor[]) => ReactNode }) {
  const [page, setPage] = useState(1);
  const lastPage = Math.max(1, Math.ceil(items.length / PER_HALAMAN));
  const safePage = Math.min(page, lastPage);
  const tampil = items.slice((safePage - 1) * PER_HALAMAN, safePage * PER_HALAMAN);

  return (
    <div className="space-y-3">
      {children(tampil)}
      <Pagination
        page={safePage}
        lastPage={lastPage}
        total={items.length}
        from={items.length === 0 ? 0 : (safePage - 1) * PER_HALAMAN + 1}
        to={Math.min(safePage * PER_HALAMAN, items.length)}
        label="rapor"
        onPageChange={setPage}
      />
    </div>
  );
}

export default function ValidasiRaporPage() {
  const [diajukan, setDiajukan] = useState<Rapor[]>([]);
  const [divalidasi, setDivalidasi] = useState<Rapor[]>([]);
  const [terbit, setTerbit] = useState<Rapor[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<number | null>(null);

  function load() {
    return Promise.all([
      api.get<Rapor[]>("/rapors", { params: { status: "Diajukan" } }),
      api.get<Rapor[]>("/rapors", { params: { status: "Divalidasi" } }),
      api.get<Rapor[]>("/rapors", { params: { status: "Diterbitkan" } }),
    ]).then(([a, b, t]) => {
      setDiajukan(a.data);
      setDivalidasi(b.data);
      setTerbit(t.data);
      setLoading(false);
    });
  }

  useEffect(() => { load(); }, []);

  async function validasi(id: number, disetujui: boolean) {
    setProcessingId(id);
    await api.post(`/rapors/${id}/validasi`, { disetujui });
    setProcessingId(null);
    load();
  }

  async function terbitkan(id: number) {
    setProcessingId(id);
    await api.post(`/rapors/${id}/terbitkan`);
    setProcessingId(null);
    load();
  }

  return (
    <div className="animate-fade-in space-y-8">
      <div>
        <PageHeader title="Rapor Menunggu Validasi" description="Rapor yang diajukan oleh wali kelas untuk direview." />

        {loading ? (
          <Skeleton className="h-40 w-full" />
        ) : diajukan.length === 0 ? (
          <EmptyState title="Tidak ada rapor" description="Semua rapor sudah divalidasi atau belum ada yang diajukan." />
        ) : (
          <HalamanRapor items={diajukan}>
            {(tampil) => tampil.map((r) => (
              <Card key={r.id}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-800">
                      {r.siswa.nama} <span className="text-slate-400 font-mono text-xs">({r.siswa.nis})</span>
                    </p>
                    <p className="text-sm text-slate-500">{r.siswa.kelas_rombel?.nama}</p>
                    {r.catatan_wali_kelas && (
                      <p className="text-xs text-slate-400 italic mt-1">&ldquo;{r.catatan_wali_kelas}&rdquo;</p>
                    )}
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <Button size="sm" onClick={() => validasi(r.id, true)} loading={processingId === r.id}>
                      Setujui
                    </Button>
                    <Button size="sm" variant="danger" onClick={() => validasi(r.id, false)} loading={processingId === r.id}>
                      Tolak
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </HalamanRapor>
        )}
      </div>

      <div>
        <PageHeader title="Siap Diterbitkan" description="Rapor yang sudah divalidasi dan siap diterbitkan." />

        {loading ? (
          <Skeleton className="h-40 w-full" />
        ) : divalidasi.length === 0 ? (
          <EmptyState title="Tidak ada rapor" description="Belum ada rapor yang menunggu penerbitan." />
        ) : (
          <HalamanRapor items={divalidasi}>
            {(tampil) => tampil.map((r) => (
              <Card key={r.id}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-800">
                      {r.siswa.nama} <span className="text-slate-400 font-mono text-xs">({r.siswa.nis})</span>
                    </p>
                    <p className="text-sm text-slate-500">{r.siswa.kelas_rombel?.nama}</p>
                  </div>
                  <Button size="sm" variant="primary" onClick={() => terbitkan(r.id)} loading={processingId === r.id}>
                    Terbitkan
                  </Button>
                </div>
              </Card>
            ))}
          </HalamanRapor>
        )}
      </div>

      <div>
        <PageHeader title="Sudah Diterbitkan" description="Rapor yang sudah diterima dan dapat dicetak." />

        {loading ? (
          <Skeleton className="h-40 w-full" />
        ) : terbit.length === 0 ? (
          <EmptyState title="Belum ada rapor" description="Rapor diterbitkan akan tampil di sini." />
        ) : (
          <HalamanRapor items={terbit}>
            {(tampil) => tampil.map((r) => (
              <Card key={r.id}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-800">
                      {r.siswa.nama} <span className="text-slate-400 font-mono text-xs">({r.siswa.nis})</span>
                    </p>
                    <p className="text-sm text-slate-500">{r.siswa.kelas_rombel?.nama}</p>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <Badge variant="success">Diterbitkan</Badge>
                    <Link href={`/rapor-cetak/${r.id}`}>
                      <Button size="sm" variant="outline">Cetak</Button>
                    </Link>
                  </div>
                </div>
              </Card>
            ))}
          </HalamanRapor>
        )}
      </div>
    </div>
  );
}
