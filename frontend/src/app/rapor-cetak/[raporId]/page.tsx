"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { RaporCetak } from "@/lib/types";
import { Button, Alert, Skeleton } from "@/components/ui";

export default function RaporCetakPage() {
  const params = useParams<{ raporId: string }>();
  const router = useRouter();
  const [data, setData] = useState<RaporCetak | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const muat = useCallback(() => {
    api.get<RaporCetak>(`/rapors/${params.raporId}/cetak`).then((res) => {
      setData(res.data);
      setLoading(false);
    }).catch((err: unknown) => {
      const pesan = (err as { response?: { data?: { message?: string } } })?.response?.data;
      setError(pesan?.message ?? "Gagal memuat rapor.");
      setLoading(false);
    });
  }, [params.raporId]);

  useEffect(() => { muat(); }, [muat]);

  return (
    <div className="min-h-screen bg-slate-100 print:bg-white">
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @page { size: A4 portrait; margin: 1.5cm 1.3cm 1.2cm; }
            .cetak-page { font-family: "Times New Roman", Times, serif; font-size: 14px; color: #000; }
            .cetak-page table { border-collapse: collapse; width: 100%; }
            .cetak-page th, .cetak-page td { border: 1px solid #000; padding: 6px 8px; text-align: center; vertical-align: middle; line-height: 1.4; }
            .cetak-page table.noborder td, .cetak-page table.noborder th { border: none; padding: 4px 8px; text-align: left; }
            .cetak-page .rtl { direction: rtl; }
            .cetak-page .ltr { direction: ltr; }
            .cetak-page .mapel-cell { text-align: right; white-space: nowrap; }
            .cetak-page .desc-cell { text-align: right; }
            @media print {
              .no-print { display: none !important; }
              body { background: #fff !important; }
              .cetak-wrap { padding: 0 !important; background: #fff !important; box-shadow: none !important; border: none !important; }
              .break-page { page-break-before: always; }
              .cetak-page tr { page-break-inside: avoid; break-inside: avoid; }
            }
          `,
        }}
      />

      <div className="no-print sticky top-0 z-10 bg-white/90 backdrop-blur border-b border-slate-200 px-4 py-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button type="button" variant="outline" onClick={() => router.back()}>Kembali</Button>
          <p className="text-sm text-slate-500">Pratinjau Rapor — {data?.siswa.nama ?? ""}</p>
        </div>
        <Button onClick={() => window.print()}>Cetak / Simpan PDF</Button>
      </div>

      <div className="cetak-wrap bg-white shadow-xl border border-slate-200 max-w-[210mm] mx-auto my-6 p-8">
        {loading ? (
          <Skeleton className="h-96 w-full" />
        ) : error ? (
          <div className="py-10">
            <Alert variant="danger" onClose={() => setError(null)}>{error}</Alert>
          </div>
        ) : data ? (
          <div className="cetak-page">
            {/* ── Kop ── */}
            <div className="text-center mb-4">
              <div className="text-xl font-bold uppercase tracking-wide">{data.sekolah.nama_sekolah}</div>
              <div className="text-[13px]">
                {data.sekolah.alamat}
                {data.sekolah.kota_kabupaten ? `, ${data.sekolah.kota_kabupaten}` : ""}
                {data.sekolah.kode_pos ? ` ${data.sekolah.kode_pos}` : ""}
                {data.sekolah.npsn ? ` — NPSN: ${data.sekolah.npsn}` : ""}
              </div>
              <div className="mt-3 text-lg font-bold">RAPORT PESANTREN</div>
              <div className="text-[13px]">
                Semester {data.semester.nama} · Tahun Ajaran {data.semester.tahun}
              </div>
            </div>

            {/* ── Identitas ── */}
            <table className="noborder mb-4">
              <tbody>
                <tr><td className="w-28">Nama Siswa</td><td className="font-bold">: {data.siswa.nama}</td></tr>
                <tr><td>NIS</td><td className="font-bold">: {data.siswa.nis}</td></tr>
                <tr><td>Kelas</td><td className="font-bold">: {data.kelas ? `${data.kelas.nama} (Tingkat ${data.kelas.tingkat})` : "-"}</td></tr>
                <tr><td>Wali Kelas</td><td className="font-bold">: {data.wali_kelas ?? "-"}</td></tr>
              </tbody>
            </table>

            {/* ── Tabel Nilai (arah RTL seperti dokumen asli) ── */}
            <table className="rtl">
              <thead>
                <tr>
                  <th className="w-10">رقم<br /><span className="ltr font-normal text-[11px]">No</span></th>
                  <th>المادة<br /><span className="ltr font-normal text-[11px]">Mata Pelajaran</span></th>
                  <th className="w-14">KKM</th>
                  <th className="w-16">القيمة<br /><span className="ltr font-normal text-[11px]">Nilai</span></th>
                  <th>القيمة بالحروف العربية<br /><span className="ltr font-normal text-[11px]">Nilai dengan Huruf Arab</span></th>
                  <th>التوصيف<br /><span className="ltr font-normal text-[11px]">Keterangan</span></th>
                </tr>
              </thead>
              <tbody>
                {data.mapel.map((m, i) => (
                  <tr key={i}>
                    <td>{i + 1}</td>
                    <td className="mapel-cell">
                      {m.nama_ar ? <div className="rtl font-bold">{m.nama_ar}</div> : null}
                      <div className="ltr text-[12px]">{m.nama_id}</div>
                    </td>
                    <td>{m.kkm !== null ? m.kkm : "-"}</td>
                    <td>{m.nilai !== null ? m.nilai : "-"}</td>
                    <td className="ltr text-right">
                        {m.terbilang ?? "-"}
                        {m.angka_arab ? <div className="rtl text-[12px]">({m.angka_arab})</div> : null}
                    </td>
                    <td>{m.ket_nilai ?? "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* ── Ringkasan ── */}
            <table className="mt-3">
              <tbody>
                <tr>
                  <td className="w-1/2 rtl font-bold">المجموع / Rata-Rata — Jumlah Nilai</td>
                  <td className="ltr w-1/2 text-right">{data.total}</td>
                </tr>
                <tr>
                  <td className="rtl font-bold">المعدّل — Rata-Rata</td>
                  <td className="ltr text-right">{data.rata2}</td>
                </tr>
                <tr>
                  <td className="rtl font-bold">المرتبة — Rangking di Kelas</td>
                  <td className="ltr text-right">{data.peringkat ? `Ke-${data.peringkat}` : "-"}</td>
                </tr>
                {data.predikat && (
                  <tr>
                    <td className="rtl font-bold">التقدير — Predikat</td>
                    <td className="rtl font-bold text-right">
                      {data.predikat.predikat_ar} — <span className="ltr">{data.predikat.predikat_id}</span>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* ── Halaman 2 ── */}
            <div className="break-page">
              <div className="text-center font-bold text-[15px] mb-3">
                المسابقات الرحليّة والمحفوظات<br />
                <span className="ltr font-normal text-[12px]">Praktik Ibadah & Hafalan</span>
              </div>
              <table className="rtl">
                <thead>
                  <tr>
                    <th className="w-10">رقم<br /><span className="ltr font-normal text-[11px]">No</span></th>
                    <th>المادة<br /><span className="ltr font-normal text-[11px]">Item</span></th>
                    <th className="w-16">القيمة<br /><span className="ltr font-normal text-[11px]">Nilai</span></th>
                    <th>البيان<br /><span className="ltr font-normal text-[11px]">Keterangan</span></th>
                  </tr>
                </thead>
                <tbody>
                  {data.praktik.map((p, i) => (
                    <tr key={i}>
                      <td>{i + 1}</td>
                      <td className="mapel-cell">
                        {p.nama_ar ? <div className="rtl font-bold">{p.nama_ar}</div> : null}
                        <div className="ltr text-[12px]">{p.nama_id}</div>
                      </td>
                      <td>{p.nilai ?? "-"}</td>
                      <td className="desc-cell">{p.keterangan ?? "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <table className="mt-3 rtl">
                <tbody>
                  <tr>
                    <td className="w-1/2 font-bold">العادة الفجرية — Pembiasaan Pagi</td>
                    <td className="ltr text-right">{data.pembiasaan !== null ? data.pembiasaan : "-"}</td>
                  </tr>
                  <tr>
                    <td className="rtl font-bold">الخُلُق — Sikap Akhlaq</td>
                    <td className="ltr text-right">{data.sikap?.akhlaq ?? "-"}</td>
                  </tr>
                  <tr>
                    <td className="rtl font-bold">الشخصيّة — Sikap Kepribadian</td>
                    <td className="ltr text-right">{data.sikap?.kepribadian ?? "-"}</td>
                  </tr>
                  <tr>
                    <td className="rtl font-bold">الغياب — Kehadiran (Sakit / Izin / Alpa)</td>
                    <td className="ltr text-right">
                      {data.kehadiran
                        ? `${data.kehadiran.sakit} / ${data.kehadiran.izin} / ${data.kehadiran.alpa}`
                        : "-"}
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* ── Tanda Tangan ── */}
              <div className="mt-8">
                <div className="rtl text-right mb-10">
                  {data.semester.tempat_tanggal_rapot ?? `${data.sekolah.kota_kabupaten ?? "Cimahi"}, ${new Date().getFullYear()}`}
                </div>
                <div className="flex justify-between text-center">
                  <div className="w-[45%]">
                    <div className="font-bold">المدير — Kepala Sekolah</div>
                    <div className="h-16" />
                    <div className="font-bold underline">{data.sekolah.kepala_sekolah ?? "................"}</div>
                    {data.sekolah.nip_kepala_sekolah && (
                      <div className="text-[12px]">NIP. {data.sekolah.nip_kepala_sekolah}</div>
                    )}
                  </div>
                  <div className="w-[45%]">
                    <div className="font-bold">دائر الصف — Wali Kelas</div>
                    <div className="h-16" />
                    <div className="font-bold underline">{data.wali_kelas ?? "................"}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}