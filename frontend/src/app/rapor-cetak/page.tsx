"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import { labelKelas, labelTingkat } from "@/lib/kelas";
import { RaporCetak } from "@/lib/types";
import { angkaArab, hurufArab, ketNilai, predikatByRank, terbilangArab } from "@/lib/arab";
import { Button, Alert, Skeleton } from "@/components/ui";

export default function RaporCetakPage() {
  return (
    <Suspense fallback={<Skeleton className="h-96 w-full max-w-4xl mx-auto my-6" />}>
      <RaporCetakView />
    </Suspense>
  );
}

function RaporCetakView() {
  const searchParams = useSearchParams();
  const siswaId = searchParams.get("siswa_id") || searchParams.get("id");
  const semesterId = searchParams.get("semester_id");
  const router = useRouter();

  const [data, setData] = useState<RaporCetak | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const muat = useCallback(() => {
    if (!siswaId) return;
    api
      .get<RaporCetak>("/rapor/cetak", {
        params: { siswa_id: siswaId, semester_id: semesterId || undefined },
      })
      .then((res) => {
        setData(res.data);
        setLoading(false);
      })
      .catch((err: unknown) => {
        const pesan = (err as { response?: { data?: { message?: string } } })?.response?.data;
        setError(pesan?.message ?? "Gagal memuat rapor.");
        setLoading(false);
      });
  }, [siswaId, semesterId]);

  useEffect(() => {
    muat();
  }, [muat]);

  const predikat =
    data?.predikat ||
    (data?.peringkat ? predikatByRank(data.peringkat) : predikatByRank(999));
  const isSementara = data?.semester.jenis === "Sementara";

  return (
    <div className="min-h-screen bg-slate-100 print:bg-white">
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @page {
              size: A4 portrait;
              margin: 1.5cm 1.3cm;
            }
            * { box-sizing: border-box; }
            body.raport {
              font-family: "Times New Roman", Times, serif;
              font-size: 15px;
              color: #000;
              margin: 0;
              padding: 0;
            }
            @media print {
              .no-print { display: none !important; }
              body { background: #fff !important; margin: 0 !important; }
              .cetak-wrap { padding: 0 !important; background: #fff !important; box-shadow: none !important; border: none !important; margin: 0 !important; max-width: 100% !important; }
              .break-page, .halaman-2 {
                page-break-before: always !important;
                break-before: page !important;
              }
              table.nilai tr, table.sub tr, table.sampul-identitas tr {
                page-break-inside: avoid !important;
                break-inside: avoid !important;
              }
            }

            .lembar {
              width: 100%;
              max-width: 800px;
              margin: 0 auto;
              padding: 16px;
              padding-top: 10px;
              font-family: "Times New Roman", Times, serif;
              font-size: 15px;
              color: #000;
              line-height: 1.4;
            }

            .halaman-2, .break-page {
              page-break-before: always;
              break-before: page;
            }

            table.nilai tr, table.sub tr {
              page-break-inside: avoid;
              break-inside: avoid;
            }

            /* Kop Sampul */
            .kop-judul {
              text-align: center;
              margin-bottom: 16px;
            }
            .kop-judul .arab-besar {
              font-size: 18px;
              font-weight: bold;
              direction: rtl;
              margin-bottom: 2px;
            }
            .kop-judul .indo-kecil {
              font-size: 11px;
              direction: rtl;
              color: #333;
              margin-bottom: 10px;
            }
            .kop-judul .judul-utama {
              font-size: 16px;
              font-weight: bold;
              letter-spacing: .5px;
            }
            .kop-judul .sub-utama {
              font-size: 13px;
            }

            /* Sampul Identitas */
            table.sampul-identitas {
              width: 100%;
              border-collapse: collapse;
              margin: 18px 0 20px;
            }
            table.sampul-identitas td {
              padding: 7px 6px;
              font-size: 13.5px;
              vertical-align: middle;
              border: none;
            }
            table.sampul-identitas td.isi {
              width: 46%;
              font-weight: bold;
            }
            table.sampul-identitas td.titik {
              width: 4%;
              text-align: center;
              color: #444;
            }
            table.sampul-identitas td.label-ar {
              width: 50%;
              direction: rtl;
              text-align: right;
            }
            table.sampul-identitas td.label-ar .label-id-inline {
              font-style: italic;
              font-size: 12px;
              direction: ltr;
              unicode-bidi: embed;
              margin-right: 8px;
            }

            .sampul-garis {
              border-top: 1px solid #000;
              margin: 18px 0;
            }

            .petunjuk-title {
              text-align: center;
              font-weight: bold;
              font-size: 13px;
              direction: rtl;
              margin-bottom: 14px;
            }
            .petunjuk-sub {
              font-weight: bold;
              font-size: 12.5px;
              margin: 14px 0 8px;
            }
            table.legenda {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 6px;
              font-size: 12.5px;
            }
            table.legenda td {
              padding: 4px 10px;
              border: none;
            }
            table.legenda td.rentang {
              width: 30%;
              direction: rtl;
              text-align: right;
            }
            table.legenda td.label {
              width: 70%;
            }

            /* Tabel Identitas Kop Halaman Nilai */
            table.identitas {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 12px;
            }
            table.identitas td {
              border: none;
              padding: 8px 10px;
              vertical-align: top;
              font-size: 15px;
            }
            table.identitas td.label-ar {
              direction: rtl;
              text-align: right;
              width: 16%;
              white-space: nowrap;
              font-weight: bold;
            }
            table.identitas td.label-id {
              width: 10%;
              font-style: italic;
              white-space: nowrap;
            }
            table.identitas td.isi {
              width: 24%;
              font-weight: bold;
            }

            /* Tabel Nilai Utama (Direction: RTL) */
            table.nilai {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 12px;
              direction: rtl;
            }
            table.nilai th, table.nilai td {
              border: 1px solid #000;
              padding: 9px 10px;
              font-size: 14px;
              text-align: center;
              vertical-align: middle;
              line-height: 1.4;
            }
            table.nilai th {
              background: #fff;
            }
            table.nilai td.mapel {
              text-align: right;
              white-space: nowrap;
            }
            table.nilai td.mapel .ar {
              font-weight: bold;
              display: block;
            }
            table.nilai td.mapel .id {
              font-size: 12px;
              color: #333;
              direction: ltr;
              display: block;
              text-align: left;
              margin-top: 2px;
            }
            table.nilai .ringkasan-label {
              font-weight: bold;
              text-align: right;
            }
            table.nilai .ringkasan-label .id {
              font-weight: normal;
              font-size: 12.5px;
              direction: ltr;
              display: inline-block;
            }
            table.nilai .ringkasan-isi {
              text-align: center;
              direction: ltr;
            }
            table.nilai .deskripsi-box {
              text-align: right;
              vertical-align: top;
              font-size: 13px;
              padding-top: 12px;
              padding-bottom: 12px;
            }
            table.nilai .deskripsi-box .judul-ar {
              font-weight: bold;
              display: block;
            }
            table.nilai .deskripsi-box .judul-id {
              font-style: italic;
              font-size: 12px;
              direction: ltr;
              display: block;
              text-align: left;
            }
            table.nilai .deskripsi-box .isi-deskripsi {
              direction: ltr;
              text-align: left;
              font-size: 12.5px;
              margin-top: 6px;
              display: block;
              line-height: 1.5;
            }

            /* Tabel Halaman 2 (Sub) */
            table.sub {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 12px;
              direction: rtl;
            }
            table.sub th, table.sub td {
              border: 1px solid #000;
              padding: 7px 9px;
              font-size: 13px;
              text-align: center;
              vertical-align: middle;
            }
            table.sub th {
              background: #fff;
            }
            table.sub td.ket {
              text-align: right;
            }
            table.sub td.ket .ar {
              font-weight: bold;
              display: block;
            }
            table.sub td.ket .id {
              font-size: 11px;
              color: #333;
              display: block;
              direction: ltr;
              text-align: left;
            }
            table.sub td.ket-materi {
              direction: ltr;
              text-align: left;
              font-size: 11px;
            }
            table.sub td.nomor-urut {
              width: 8%;
            }
            table.sub td.nilai-isi {
              direction: ltr;
            }

            /* Area TTD */
            .ttd-area {
              margin-top: 24px;
              width: 100%;
              font-size: 12px;
            }
            .ttd-area .tanggal {
              text-align: right;
              margin-bottom: 20px;
              direction: rtl;
            }
            .ttd-cols {
              display: flex;
              justify-content: space-between;
              text-align: center;
            }
            .ttd-cols .col {
              width: 45%;
            }
            .ttd-cols .col .ar {
              direction: rtl;
              font-weight: bold;
            }
            .ttd-cols .space {
              height: 55px;
            }
          `,
        }}
      />

      {/* Toolbar Print No-Print */}
      <div className="no-print sticky top-0 z-20 bg-white/95 backdrop-blur border-b border-slate-200 px-4 py-3 flex items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center gap-3">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            ← Kembali
          </Button>
          <p className="text-sm text-slate-600 font-medium">
            Pratinjau {isSementara ? "Rapor Sementara" : "Rapor"} — {data?.siswa.nama ?? "Memuat…"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {data?.siswa && (
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push(`/biodata-cetak?id=${data.siswa.id}`)}
            >
              Cetak Biodata
            </Button>
          )}
          <Button onClick={() => window.print()}>
            Cetak / Simpan sebagai PDF
          </Button>
        </div>
      </div>

      <div className="cetak-wrap bg-white shadow-xl border border-slate-200 max-w-[210mm] mx-auto my-6 p-8 print:p-0 print:border-none print:shadow-none print:my-0">
        {loading && siswaId ? (
          <Skeleton className="h-96 w-full" />
        ) : !siswaId ? (
          <div className="py-10">
            <Alert variant="danger">
              Parameter siswa_id tidak ditemukan. Silakan pilih siswa dari menu rapor atau siswa binaan.
            </Alert>
          </div>
        ) : error ? (
          <div className="py-10">
            <Alert variant="danger" onClose={() => setError(null)}>
              {error}
            </Alert>
          </div>
        ) : data ? (
          <div className="raport">
            {/* ==================== HALAMAN SAMPUL / HALAMAN PERTAMA ==================== */}
            <div className="lembar">
              <div className="kop-judul">
                <div className="arab-besar">التقرير نتائج الدراسية</div>
                <div className="indo-kecil">المدرسة الوسطى معهد الإسلامية دار السرور</div>
                <div className="judul-utama">{isSementara ? "LAPORAN SEMENTARA" : "LAPORAN"}</div>
                <div className="sub-utama">HASIL BELAJAR PESERTA DIDIK</div>
                <div className="sub-utama">SEKOLAH MENENGAH PERTAMA PLUS</div>
                {isSementara && <div className="sub-utama">( PENILAIAN TENGAH SEMESTER )</div>}
              </div>

              <table className="sampul-identitas">
                <tbody>
                  <tr>
                    <td className="isi">{data.sekolah.nama_sekolah || "-"}</td>
                    <td className="titik">:</td>
                    <td className="label-ar">
                      <span className="label-id-inline">Nama Sekolah</span>
                      اسم المدرسة
                    </td>
                  </tr>
                  <tr>
                    <td className="isi">{data.siswa.nis || "-"}</td>
                    <td className="titik">:</td>
                    <td className="label-ar">
                      <span className="label-id-inline">Nomor Induk</span>
                      رقم دفتر القيد
                    </td>
                  </tr>
                  <tr>
                    <td className="isi">
                      {data.sekolah.alamat || "-"}{" "}
                      Kode Pos : {data.sekolah.kode_pos || "-"}{" "}
                      Telp. {data.sekolah.telepon || "-"}
                    </td>
                    <td className="titik">:</td>
                    <td className="label-ar">
                      <span className="label-id-inline">Alamat Sekolah</span>
                      عنوان المدرسة
                    </td>
                  </tr>
                  <tr>
                    <td className="isi">{data.sekolah.kelurahan || "-"}</td>
                    <td className="titik">:</td>
                    <td className="label-ar">
                      <span className="label-id-inline">Kelurahan</span>
                      قرية
                    </td>
                  </tr>
                  <tr>
                    <td className="isi">{data.sekolah.kecamatan || "-"}</td>
                    <td className="titik">:</td>
                    <td className="label-ar">
                      <span className="label-id-inline">Kecamatan</span>
                      منطقة جنوب
                    </td>
                  </tr>
                  <tr>
                    <td className="isi">{data.sekolah.kota_kabupaten || "-"}</td>
                    <td className="titik">:</td>
                    <td className="label-ar">
                      <span className="label-id-inline">Kota/Kabupaten</span>
                      مدينة
                    </td>
                  </tr>
                  <tr>
                    <td className="isi">{data.sekolah.provinsi || "-"}</td>
                    <td className="titik">:</td>
                    <td className="label-ar">
                      <span className="label-id-inline">Provinsi</span>
                      مقاطعة
                    </td>
                  </tr>
                </tbody>
              </table>

              <div className="sampul-garis" />

              <div className="petunjuk-title">بيان عن الرموز الموجودة في هذه اللائحة</div>
              <div style={{ fontWeight: "bold", marginBottom: "6px" }}>Petunjuk Penggunaan</div>

              <div className="petunjuk-sub">
                <span style={{ direction: "rtl", fontWeight: "normal" }}>معنى الأرقام في النتائج</span>{" "}
                ١. Keterangan Angka pada Nilai
              </div>
              <table className="legenda">
                <tbody>
                  <tr>
                    <td className="label">Istimewa</td>
                    <td className="rentang">{angkaArab("90")} &ndash; {angkaArab("100")}</td>
                  </tr>
                  <tr>
                    <td className="label">Sangat Baik</td>
                    <td className="rentang">{angkaArab("80")} &ndash; {angkaArab("89")}</td>
                  </tr>
                  <tr>
                    <td className="label">Baik</td>
                    <td className="rentang">{angkaArab("70")} &ndash; {angkaArab("79")}</td>
                  </tr>
                  <tr>
                    <td className="label">Cukup</td>
                    <td className="rentang">{angkaArab("60")} &ndash; {angkaArab("69")}</td>
                  </tr>
                  <tr>
                    <td className="label">Kurang</td>
                    <td className="rentang">&le; {angkaArab("59")}</td>
                  </tr>
                </tbody>
              </table>

              <div className="petunjuk-sub">
                <span style={{ direction: "rtl", fontWeight: "normal" }}>معنى الأحرف في النتائج</span>{" "}
                ٢. Keterangan Huruf pada Nilai
              </div>
              <table className="legenda">
                <tbody>
                  <tr>
                    <td className="label">Baik (A)</td>
                    <td className="rentang">جيد</td>
                  </tr>
                  <tr>
                    <td className="label">Cukup (B)</td>
                    <td className="rentang">متوسط</td>
                  </tr>
                  <tr>
                    <td className="label">Buruk (C)</td>
                    <td className="rentang">رديء</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* ==================== HALAMAN 1 (Nilai) ==================== */}
            <div className="lembar break-page">
              <table className="identitas">
                <tbody>
                  <tr>
                    <td className="label-ar">اسم المدرسة</td>
                    <td className="label-id">Nama Sekolah</td>
                    <td className="isi">
                      {data.sekolah.nama_sekolah || "-"}
                      {data.sekolah.npsn ? (
                        <>
                          <br />
                          <span style={{ fontWeight: "normal", fontSize: "10px" }}>
                            NPSN: {data.sekolah.npsn}
                          </span>
                        </>
                      ) : null}
                    </td>
                    <td className="label-ar">قسم</td>
                    <td className="label-id">Kelas</td>
                    <td className="isi">
                      {data.kelas ? `${labelKelas(data.kelas.nama)} (${labelTingkat(data.kelas.tingkat)})` : "-"}
                    </td>
                  </tr>
                  <tr>
                    <td className="label-ar">عنوان المدرسة</td>
                    <td className="label-id">Alamat Sekolah</td>
                    <td className="isi">{data.sekolah.alamat || "-"}</td>
                    <td className="label-ar">نصف السنة</td>
                    <td className="label-id">Semester</td>
                    <td className="isi">
                      {data.semester.nama}
                      {isSementara ? " (Sementara)" : ""}
                    </td>
                  </tr>
                  <tr>
                    <td className="label-ar">اسم الطالب/الطالبة</td>
                    <td className="label-id">Nama Siswa</td>
                    <td className="isi">{data.siswa.nama}</td>
                    <td className="label-ar">سنة الدراسة</td>
                    <td className="label-id">Tahun Pelajaran</td>
                    <td className="isi">{data.semester.tahun}</td>
                  </tr>
                </tbody>
              </table>

              <table className="nilai">
                <thead>
                  <tr>
                    <th rowSpan={2} style={{ width: "6%" }}>
                      رقم<br />
                      <span style={{ fontWeight: "normal" }}>No</span>
                    </th>
                    <th rowSpan={2} style={{ width: "28%" }}>
                      قنوان الدروس<br />
                      <span style={{ fontWeight: "normal" }}>Mata Pelajaran</span>
                    </th>
                    <th rowSpan={2} style={{ width: "12%" }}>
                      النهاية الصغرى<br />
                      <span style={{ fontWeight: "normal" }}>KKM</span>
                    </th>
                    <th colSpan={2} style={{ width: "28%" }}>
                      المهارة<br />
                      <span style={{ fontWeight: "normal" }}>Nilai</span>
                    </th>
                    <th rowSpan={2} style={{ width: "26%" }}>
                      معايير القيمة<br />
                      <span style={{ fontWeight: "normal" }}>Kriteria Penilaian</span>
                    </th>
                  </tr>
                  <tr>
                    <th style={{ width: "14%" }}>
                      شخصية<br />
                      <span style={{ fontWeight: "normal" }}>Angka</span>
                    </th>
                    <th style={{ width: "14%" }}>
                      حروف<br />
                      <span style={{ fontWeight: "normal" }}>Huruf</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data.mapel.map((m, idx) => (
                    <tr key={idx}>
                      <td>{angkaArab(idx + 1)}</td>
                      <td className="mapel">
                        <span className="id">{m.nama_id}</span>
                        <span className="ar">{m.nama_ar}</span>
                      </td>
                      <td>{m.kkm !== null ? angkaArab(m.kkm) : "-"}</td>
                      <td>{m.nilai !== null ? angkaArab(m.nilai) : "-"}</td>
                      <td>{m.nilai !== null ? (m.terbilang || terbilangArab(m.nilai)) : "-"}</td>
                      <td>{m.nilai !== null ? (m.ket_nilai || ketNilai(m.nilai)) : "-"}</td>
                    </tr>
                  ))}
                  <tr>
                    <td colSpan={3} rowSpan={3} className="deskripsi-box">
                      <span className="judul-ar">
                        المسند القيمة: {predikat.predikat_ar} / {predikat.predikat_id}
                      </span>
                      <span className="judul-ar" style={{ marginTop: "6px" }}>
                        وصف تقدم التعلم
                      </span>
                      <span className="judul-id">Deskripsi Kemajuan Belajar:</span>
                      <span className="isi-deskripsi">{predikat.deskripsi}</span>
                    </td>
                    <td colSpan={2} className="ringkasan-label">
                      مجموع النتائج <span className="id">/ Total Nilai</span>
                    </td>
                    <td className="ringkasan-isi">{angkaArab(data.total)}</td>
                  </tr>
                  <tr>
                    <td colSpan={2} className="ringkasan-label">
                      التعادل <span className="id">/ Rata-Rata</span>
                    </td>
                    <td className="ringkasan-isi">
                      {angkaArab(data.rata2)} ({angkaArab(data.rata2_bulat)})
                    </td>
                  </tr>
                  <tr>
                    <td colSpan={2} className="ringkasan-label">
                      المرتبة <span className="id">/ Peringkat</span>
                    </td>
                    <td className="ringkasan-isi">{angkaArab(data.peringkat)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* ==================== HALAMAN 2 ==================== */}
            <div className="lembar break-page halaman-2">
              {/* Pengembangan Diri */}
              <table className="sub">
                <thead>
                  <tr>
                    <th style={{ width: "20%" }}>
                      المهارة<br />
                      <span style={{ fontWeight: "normal" }}>Nilai</span>
                    </th>
                    <th>
                      وظيفة التنمية الذاتية<br />
                      <span style={{ fontWeight: "normal" }}>Kegiatan Pengembangan Diri</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="nilai-isi">{angkaArab(data.pembiasaan)}</td>
                    <td className="ket">
                      <span className="ar">تعويد بالغدوة</span>
                      <span className="id">Pembiasaan Pagi</span>
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* Praktik & Hafalan */}
              <table className="sub">
                <thead>
                  <tr>
                    <th style={{ width: "12%" }}>
                      المهارة<br />
                      <span style={{ fontWeight: "normal" }}>Nilai</span>
                    </th>
                    <th style={{ width: "38%" }}>
                      المعلومة<br />
                      <span style={{ fontWeight: "normal" }}>Keterangan</span>
                    </th>
                    <th>
                      الممارسة والمحفوظات وقرائة الكتب<br />
                      <span style={{ fontWeight: "normal" }}>Praktik, Hafalan dan Pembacaan Kitab</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data.praktik.map((p, idx) => (
                    <tr key={idx}>
                      <td className="nilai-isi">{hurufArab(p.nilai)}</td>
                      <td className="ket-materi">{p.keterangan || "-"}</td>
                      <td className="ket">
                        {p.nama_ar ? <span className="ar">{p.nama_ar}</span> : null}
                        <span className="id">{p.nama_id}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Sikap Sehari-hari */}
              <table className="sub">
                <thead>
                  <tr>
                    <th style={{ width: "20%" }}>
                      المهارة<br />
                      <span style={{ fontWeight: "normal" }}>Nilai</span>
                    </th>
                    <th>
                      المعاملة اليومية<br />
                      <span style={{ fontWeight: "normal" }}>Sikap Sehari-hari</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="nilai-isi">{hurufArab(data.sikap?.akhlaq)}</td>
                    <td className="ket">
                      <span className="ar">اخلاق</span>
                      <span className="id">Akhlaq</span>
                    </td>
                  </tr>
                  <tr>
                    <td className="nilai-isi">{hurufArab(data.sikap?.kepribadian)}</td>
                    <td className="ket">
                      <span className="ar">شخصية</span>
                      <span className="id">Kepribadian</span>
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* Ketidakhadiran */}
              <table className="sub">
                <thead>
                  <tr>
                    <th style={{ width: "8%" }}>
                      رقم<br />
                      <span style={{ fontWeight: "normal" }}>No</span>
                    </th>
                    <th style={{ width: "20%" }}>
                      ايام<br />
                      <span style={{ fontWeight: "normal" }}>Hari</span>
                    </th>
                    <th>
                      الغياب<br />
                      <span style={{ fontWeight: "normal" }}>Ketidakhadiran</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="nomor-urut">١</td>
                    <td className="nilai-isi">{angkaArab(data.kehadiran?.sakit ?? 0)}</td>
                    <td className="ket">
                      <span className="ar">المرض</span>
                      <span className="id">Sakit</span>
                    </td>
                  </tr>
                  <tr>
                    <td className="nomor-urut">٢</td>
                    <td className="nilai-isi">{angkaArab(data.kehadiran?.izin ?? 0)}</td>
                    <td className="ket">
                      <span className="ar">الرخصة</span>
                      <span className="id">Izin</span>
                    </td>
                  </tr>
                  <tr>
                    <td className="nomor-urut">٣</td>
                    <td className="nilai-isi">{angkaArab(data.kehadiran?.alpa ?? 0)}</td>
                    <td className="ket">
                      <span className="ar">لاهمال</span>
                      <span className="id">Alpa</span>
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* Area Tanda Tangan */}
              <div className="ttd-area">
                <div className="tanggal">
                  {data.semester.tempat_tanggal_rapot ||
                    `${data.sekolah.kota_kabupaten || "Cimahi"}, ${new Date().toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}`}
                </div>
                <div className="ttd-cols">
                  <div className="col">
                    <span className="ar">ولي الطالب</span>
                    <br />
                    <span style={{ fontStyle: "italic" }}>Wali Murid</span>
                    <div className="space" />
                    ( .............................. )
                  </div>
                  <div className="col">
                    <span className="ar">ولي القسم</span>
                    <br />
                    <span style={{ fontStyle: "italic" }}>Wali Kelas</span>
                    <div className="space" />
                    ( {data.wali_kelas || ".............................."} )
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