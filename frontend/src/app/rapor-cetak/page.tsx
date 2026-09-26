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
              margin: 2cm 1.5cm;
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
              /* Tabel nilai utama + keterangan total/rata-rata/peringkat
                 harus tetap satu lembar */
              table.nilai {
                page-break-inside: avoid !important;
                break-inside: avoid !important;
              }
            }

            .lembar {
              /* Token ukuran & jarak label Arab / Indonesia (dipakai seragam) */
              --fs-ar: 14px;
              --fs-id: 12px;
              --fs-judul-ar: 18px;
              --fs-judul-id: 16px;
              --gap-ar-id: 2px;
              --jarak-kolom: 12px;
              width: 100%;
              max-width: 210mm;
              margin: 0 auto;
              padding: 10px 4px;
              padding-top: 10px;
              /* Isi penuh satu lembar A4: tinggi minimum = tinggi kertas
                 dikurangi margin atas-bawah @page (2cm + 2cm) */
              min-height: 252mm;
              display: flex;
              flex-direction: column;
              justify-content: flex-start;
              font-family: "Times New Roman", Times, serif;
              font-size: 15px;
              color: #000;
              line-height: 1.4;
            }

            .halaman-2, .break-page {
              page-break-before: always;
              break-before: page;
            }

            /* Tabel isi menyerap sisa tinggi lembar agar baris-barisnya
               merenggang dan halaman terisi penuh sampai bawah */
            table.sampul-identitas,
            table.legenda,
            table.nilai,
            table.sub {
              flex-grow: 1;
            }

            table.nilai tr, table.sub tr {
              page-break-inside: avoid;
              break-inside: avoid;
            }

            /* Kop Sampul */
            .kop-judul {
              text-align: center;
              margin-bottom: 16px;
              line-height: 1.35;
            }
            .kop-judul .arab-besar {
              font-size: var(--fs-judul-ar);
              font-weight: bold;
              direction: rtl;
              unicode-bidi: isolate;
              margin-bottom: 2px;
            }
            .kop-judul .indo-kecil {
              font-size: var(--fs-judul-id);
              font-weight: bold;
              direction: rtl;
              unicode-bidi: isolate;
              margin-bottom: 10px;
            }
            .kop-judul .judul-utama {
              font-size: var(--fs-judul-id);
              font-weight: bold;
              letter-spacing: .5px;
            }
            .kop-judul .sub-utama {
              font-size: 14px;
              font-weight: bold;
              letter-spacing: .5px;
            }

            /* Sampul Identitas — 4 kolom: data | titik | label-id | label-ar
               Kolom label memakai width:1% + nowrap agar menempel pada isinya,
               sehingga jarak label Indonesia <-> Arab selalu tetap (--jarak-kolom) */
            table.sampul-identitas {
              width: 100%;
              border-collapse: collapse;
              margin: 18px 0 20px;
            }
            table.sampul-identitas td {
              padding: 6px 6px;
              font-size: 13.5px;
              vertical-align: middle;
              border: none;
            }
            table.sampul-identitas td.isi {
              width: 38%;
              font-weight: normal;
              text-align: right;
            }
            table.sampul-identitas td.titik {
              width: 1%;
              white-space: nowrap;
              text-align: center;
              color: #444;
            }
            table.sampul-identitas td.label-id {
              width: 1%;
              white-space: nowrap;
              padding-right: 0;
              font-size: var(--fs-id);
              font-weight: normal;
              direction: ltr;
              text-align: right;
            }
            table.sampul-identitas td.label-ar {
              width: 1%;
              white-space: nowrap;
              padding-left: var(--jarak-kolom);
              font-size: var(--fs-ar);
              direction: rtl;
              text-align: right;
              font-weight: normal;
            }

            .sampul-garis {
              border-top: 1px dashed #000;
              margin: 18px 0;
            }

            /* Petunjuk Penggunaan — mengikuti tata letak Laporan: isi report
               rata kanan (RTL), pasangan label Arab & Indonesia berdampingan
               dan menempel dengan jarak tetap --jarak-kolom */
            .petunjuk-title {
              text-align: center;
              font-weight: bold;
              font-size: var(--fs-judul-ar);
              direction: rtl;
              unicode-bidi: isolate;
              margin-bottom: 4px;
            }
            .petunjuk-title-id {
              text-align: center;
              font-weight: bold;
              font-size: var(--fs-judul-id);
              direction: ltr;
              margin-bottom: 18px;
            }

            table.legenda {
              width: auto;
              border-collapse: collapse;
              margin: 0 0 6px auto;
            }
            table.legenda td {
              padding: 3px calc(var(--jarak-kolom) / 2);
              border: none;
              white-space: nowrap;
              text-align: right;
            }
            table.legenda td.rentang {
              font-size: var(--fs-ar);
              font-weight: bold;
              direction: rtl;
              unicode-bidi: isolate;
            }
            table.legenda td.label {
              font-size: var(--fs-id);
              font-weight: normal;
              direction: ltr;
              unicode-bidi: isolate;
            }
            .petunjuk-sub {
              display: flex;
              flex-direction: row;
              justify-content: flex-end;
              align-items: baseline;
              gap: var(--jarak-kolom);
              margin: 12px 0 6px;
            }
            .petunjuk-sub .id-label {
              font-size: var(--fs-id);
              font-weight: normal;
              direction: ltr;
              text-align: right;
              unicode-bidi: isolate;
            }
            .petunjuk-sub .ar-label {
              font-size: var(--fs-ar);
              font-weight: bold;
              direction: rtl;
              text-align: right;
              unicode-bidi: isolate;
            }

            /* Tabel Identitas Kop Halaman Nilai — mengikuti referensi .docx:
               4 kolom LTR tanpa garis, baris selang-seling label Arab
               (bold 14pt + ":") dan label Indonesia */
            table.identitas {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 6px;
              direction: rtl;
            }
            table.identitas td {
              border: none;
              padding: 1px 4px;
              vertical-align: top;
              font-size: var(--fs-ar);
              font-weight: normal;
              line-height: 1.3;
            }
            table.identitas td.label-ar {
              white-space: nowrap;
              direction: rtl;
              text-align: right;
              font-size: var(--fs-ar);
              font-weight: bold;
            }
            table.identitas td.label-id {
              white-space: nowrap;
              direction: ltr;
              text-align: right;
              font-size: var(--fs-id);
              font-weight: normal;
              font-style: italic;
            }
            table.identitas td.titik {
              white-space: nowrap;
              text-align: center;
              font-weight: normal;
            }
            table.identitas tr:nth-child(odd) td {
              padding-bottom: 0;
            }
            table.identitas tr:nth-child(even) td {
              padding-bottom: 6px;
            }
            table.identitas td.isi {
              direction: ltr;
              text-align: right;
              font-size: var(--fs-ar);
              font-weight: normal;
            }

            /* Tabel Nilai Utama (Direction: RTL)
              Pasangan label Arab & Indonesia inline dengan jarak tetap,
               mengikuti cetak.php */
            /* Tabel Nilai Utama — mengikuti referensi .docx (7 kolom):
               [No | Mapel-AR | Mapel-ID | KKM | Angka | Huruf | Kriteria].
               Semua isi bold; angka memakai angka Arab. */
            table.nilai {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 12px;
              direction: rtl;
            }
            table.nilai th, table.nilai td {
              border: 1px solid #000;
              padding: 5px 6px;
              font-size: var(--fs-ar);
              font-weight: bold;
              text-align: center;
              vertical-align: middle;
              line-height: 1.3;
            }
            table.nilai th {
              font-weight: bold;
            }
            table.nilai th {
              background: #fff;
            }
            /* Header: Arab di atas, Indonesia di bawah, semua bold & center */
            table.nilai thead th .th-ar {
              display: block;
              font-size: 14pt;
              font-weight: bold;
              direction: rtl;
              unicode-bidi: isolate;
            }
            table.nilai thead th .th-id {
              display: block;
              font-size: 12pt;
              font-weight: bold;
              direction: ltr;
              unicode-bidi: isolate;
            }
            table.nilai thead th.no .th-ar { font-size: 12pt; }
            table.nilai thead th.no .th-id { font-size: 8pt; }
            table.nilai thead th.kriteria .th-ar { font-size: 18pt; }
            table.nilai thead tr.sub th .th-ar,
            table.nilai thead tr.sub th .th-id { font-size: 12pt; }
            /* Kolom nomor */
            table.nilai td.no {
              font-size: 12pt;
            }
            /* Kolom mapel: Arab kanan, Indonesia kiri, kolom terpisah */
            table.nilai td.mapel-ar {
              text-align: right;
              direction: rtl;
              unicode-bidi: isolate;
              font-weight: bold;
            }
            table.nilai td.mapel-id {
              text-align: left;
              direction: ltr;
              unicode-bidi: isolate;
              font-size: var(--fs-id);
              font-weight: normal;
              font-style: italic;
            }
            /* Label ringkasan (Total/Rata-rata/Peringkat): Arab 12pt di atas,
               Indonesia 12pt di bawah */
            table.nilai td.ring-label {
              font-weight: bold;
              text-align: center;
            }
            table.nilai td.ring-label .ar {
              display: block;
              font-size: 12pt;
              direction: rtl;
              unicode-bidi: isolate;
            }
            table.nilai td.ring-label .id {
              display: block;
              font-size: 12pt;
              direction: ltr;
              unicode-bidi: isolate;
            }
            table.nilai td.ring-label.peringkat .ar { font-size: 14pt; }
            table.nilai td.ring-val {
              font-size: 14pt;
              font-weight: bold;
              text-align: center;
              direction: ltr;
            }
            table.nilai td.ring-val.total { font-size: 12pt; }
            /* Kolom predikat & deskripsi */
            table.nilai td.predikat {
              font-weight: bold;
              text-align: center;
            }
            table.nilai td.predikat .ar {
              display: block;
              font-size: 14pt;
              direction: rtl;
              unicode-bidi: isolate;
            }
            table.nilai td.predikat .id {
              display: block;
              font-size: 12pt;
              direction: ltr;
              unicode-bidi: isolate;
            }
            table.nilai td.deskripsi {
              font-weight: bold;
              text-align: center;
            }
            table.nilai td.deskripsi .ar {
              display: block;
              font-size: 14pt;
              direction: rtl;
              unicode-bidi: isolate;
            }
            table.nilai td.deskripsi .id {
              display: block;
              font-size: 12pt;
              direction: ltr;
              unicode-bidi: isolate;
            }
            table.nilai td.deskripsi .isi-deskripsi {
              display: block;
              font-size: 9pt;
              direction: ltr;
              unicode-bidi: isolate;
              line-height: 1.4;
            }

            /* Tabel Halaman 2 (Sub) — mengikuti referensi .docx: tanpa garis,
               kolom Indonesia & Arab terpisah, teks Indonesia bold-italic */
            table.sub {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 12px;
              direction: ltr;
            }
            table.sub th, table.sub td {
              border: 1px solid #000;
              padding: 5px 8px;
              font-size: var(--fs-ar);
              font-weight: normal;
              text-align: center;
              vertical-align: middle;
              line-height: 1.3;
            }
            table.sub th {
              background: #fff;
              font-weight: bold;
            }
            table.sub thead th .th-ar {
              display: block;
              font-size: var(--fs-ar);
              font-weight: bold;
              direction: rtl;
              unicode-bidi: isolate;
            }
            table.sub thead th .th-id {
              display: block;
              font-size: var(--fs-id);
              font-weight: bold;
              direction: ltr;
              unicode-bidi: isolate;
            }
            table.sub td.nilai-isi {
              font-weight: bold;
              direction: ltr;
              unicode-bidi: isolate;
            }
            table.sub td.id {
              font-size: var(--fs-id);
              font-weight: normal;
              font-style: italic;
              direction: ltr;
              unicode-bidi: isolate;
              text-align: center;
            }
            table.sub td.ar {
              font-weight: bold;
              direction: rtl;
              unicode-bidi: isolate;
              text-align: center;
            }
            table.sub td.ket-materi {
              font-size: var(--fs-id);
              font-weight: normal;
              font-style: italic;
              direction: ltr;
              unicode-bidi: isolate;
              text-align: center;
            }

            /* Area TTD — mengikuti referensi .docx */
            .ttd-area {
              margin-top: 24px;
              width: 100%;
              font-size: 11pt;
              font-weight: normal;
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
              font-size: 14pt;
            }
            .ttd-cols .col .id {
              font-weight: bold;
              font-size: 11pt;
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
                    <td className="label-id">Nama Sekolah</td>
                    <td className="label-ar">اسم المدرسة</td>
                  </tr>
                  <tr>
                    <td className="isi">{data.siswa.nis || "-"}</td>
                    <td className="titik">:</td>
                    <td className="label-id">Nomor Induk</td>
                    <td className="label-ar">رقم دفتر القيد</td>
                  </tr>
                  <tr>
                    <td className="isi">
                      {data.sekolah.alamat
                        ? <>{data.sekolah.alamat}&nbsp; Kode Pos : {data.sekolah.kode_pos || "-"}&nbsp; Telp. {data.sekolah.telepon || "-"}</>
                        : <>{data.sekolah.kode_pos ? `Kode Pos : ${data.sekolah.kode_pos}` : ""}{data.sekolah.telepon ? ` Telp. ${data.sekolah.telepon}` : ""}</>}
                    </td>
                    <td className="titik">:</td>
                    <td className="label-id">Alamat Sekolah</td>
                    <td className="label-ar">عنوان المدرسة</td>
                  </tr>
                  <tr>
                    <td className="isi">{data.sekolah.kelurahan || "-"}</td>
                    <td className="titik">:</td>
                    <td className="label-id">Kelurahan</td>
                    <td className="label-ar">قرية</td>
                  </tr>
                  <tr>
                    <td className="isi">{data.sekolah.kecamatan || "-"}</td>
                    <td className="titik">:</td>
                    <td className="label-id">Kecamatan</td>
                    <td className="label-ar">منطقة جنوب</td>
                  </tr>
                  <tr>
                    <td className="isi">{data.sekolah.kota_kabupaten || "-"}</td>
                    <td className="titik">:</td>
                    <td className="label-id">Kota/Kabupaten</td>
                    <td className="label-ar">مدينة</td>
                  </tr>
                  <tr>
                    <td className="isi">{data.sekolah.provinsi || "-"}</td>
                    <td className="titik">:</td>
                    <td className="label-id">Provinsi</td>
                    <td className="label-ar">مقاطعة</td>
                  </tr>
                </tbody>
              </table>

              <div className="sampul-garis" />

              <div className="petunjuk-title">بيان عن الرموز الموجودة في هذه اللائحة</div>
              <div className="petunjuk-title-id">Petunjuk penggunaan</div>

              <div className="petunjuk-sub">
                <span className="id-label">Keterangan Angka pada Nilai</span>
                <span className="ar-label">١. معنى الأرقام في النتائج</span>
              </div>
              <table className="legenda">
                <tbody>
                  <tr>
                    <td className="label">Istimewa</td>
                    <td className="rentang">٩ ـ ممتاز</td>
                  </tr>
                  <tr>
                    <td className="label">Sangat Baik</td>
                    <td className="rentang">٨ ـ جيد جدا</td>
                  </tr>
                  <tr>
                    <td className="label">Baik</td>
                    <td className="rentang">٧ ـ جيد</td>
                  </tr>
                  <tr>
                    <td className="label">Cukup</td>
                    <td className="rentang">٦ ـ متوسط</td>
                  </tr>
                  <tr>
                    <td className="label">Kurang</td>
                    <td className="rentang">٥ ـ رديء</td>
                  </tr>
                </tbody>
              </table>

              <div className="petunjuk-sub">
                <span className="id-label">Keterangan Huruf pada Nilai</span>
                <span className="ar-label">٢. معنى الأحرف في النتائج</span>
              </div>
              <table className="legenda">
                <tbody>
                  <tr>
                    <td className="label">Baik (A)</td>
                    <td className="rentang">أ ـ جيد</td>
                  </tr>
                  <tr>
                    <td className="label">Cukup (B)</td>
                    <td className="rentang">ب ـ متوسط</td>
                  </tr>
                  <tr>
                    <td className="label">Buruk (C)</td>
                    <td className="rentang">ج ـ رديء</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* ==================== HALAMAN 1 (Nilai) ==================== */}
            <div className="lembar break-page">
              <table className="identitas">
                <colgroup>
                  <col style={{ width: "16%" }} />
                  <col style={{ width: "3%" }} />
                  <col style={{ width: "42%" }} />
                  <col style={{ width: "14.5%" }} />
                  <col style={{ width: "3%" }} />
                  <col style={{ width: "21.5%" }} />
                </colgroup>
                <tbody>
                  <tr>
                    <td className="label-ar">اسم المدرسة</td>
                    <td className="titik">:</td>
                    <td className="isi">{data.sekolah.nama_sekolah || "-"}</td>
                    <td className="label-ar">قسم</td>
                    <td className="titik">:</td>
                    <td className="isi">
                      {data.kelas ? `${labelKelas(data.kelas.nama)} (${labelTingkat(data.kelas.tingkat)})` : "-"}
                    </td>
                  </tr>
                  <tr>
                    <td className="label-id">Nama Sekolah</td>
                    <td />
                    <td />
                    <td className="label-id">Kelas</td>
                    <td />
                    <td />
                  </tr>
                  <tr>
                    <td className="label-ar">عنوان المدرسة</td>
                    <td className="titik">:</td>
                    <td className="isi">{data.sekolah.alamat || "-"}</td>
                    <td className="label-ar">نصف السنة</td>
                    <td className="titik">:</td>
                    <td className="isi">
                      {data.semester.nama}
                      {isSementara ? " (Sementara)" : ""}
                    </td>
                  </tr>
                  <tr>
                    <td className="label-id">Alamat Sekolah</td>
                    <td />
                    <td />
                    <td className="label-id">Semester</td>
                    <td />
                    <td />
                  </tr>
                  <tr>
                    <td className="label-ar">اسم الطالب/الطالبة</td>
                    <td className="titik">:</td>
                    <td className="isi" rowSpan={2}>{data.siswa.nama}</td>
                    <td className="label-ar">سنة الدراسة</td>
                    <td className="titik">:</td>
                    <td className="isi">{data.semester.tahun}</td>
                  </tr>
                  <tr>
                    <td className="label-id">Nama Siswa</td>
                    <td />
                    <td className="label-id">Tahun Pelajaran</td>
                    <td />
                    <td />
                  </tr>
                </tbody>
              </table>

              <table className="nilai">
                <thead>
                  <tr>
                    <th rowSpan={2} className="no" style={{ width: "6.5%" }}>
                      <span className="th-ar">رقم</span>
                      <span className="th-id">Nomor</span>
                    </th>
                    <th colSpan={2} rowSpan={2} style={{ width: "28.6%", verticalAlign: "middle" }}>
                      <span className="th-ar">قنوان الدروس</span>
                      <span className="th-id">Mata Pelajaran</span>
                    </th>
                    <th rowSpan={2} style={{ width: "9.1%" }}>
                      <span className="th-ar">النهاية الصغرى</span>
                      <span className="th-id">KKM</span>
                    </th>
                    <th colSpan={2} style={{ width: "40.2%" }}>
                      <span className="th-ar">المهارة</span>
                      <span className="th-id">Nilai</span>
                    </th>
                    <th rowSpan={2} className="kriteria" style={{ width: "15.6%" }}>
                      <span className="th-ar">معايير القيمة</span>
                      <span className="th-id">Kriteria Penilaian</span>
                    </th>
                  </tr>
                  <tr className="sub">
                    <th style={{ width: "9.1%" }}>
                      <span className="th-ar">شخصية</span>
                      <span className="th-id">Angka</span>
                    </th>
                    <th style={{ width: "31.1%" }}>
                      <span className="th-ar">حروف</span>
                      <span className="th-id">Huruf</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data.mapel.map((m, idx) => (
                    <tr key={idx}>
                      <td className="no">{angkaArab(idx + 1)}</td>
                      <td className="mapel-ar" style={{ width: "14.3%" }}>{m.nama_ar}</td>
                      <td className="mapel-id" style={{ width: "14.3%" }}>{m.nama_id}</td>
                      <td>{m.kkm !== null ? angkaArab(m.kkm) : "-"}</td>
                      <td>{m.nilai !== null ? angkaArab(m.nilai) : "-"}</td>
                      <td>{m.nilai !== null ? (m.terbilang || terbilangArab(m.nilai)) : "-"}</td>
                      <td>{m.nilai !== null ? (m.ket_nilai || ketNilai(m.nilai)) : "-"}</td>
                    </tr>
                  ))}
                  <tr>
                    <td className="no">{angkaArab(data.mapel.length + 1)}</td>
                    <td colSpan={2} className="ring-label">
                      <span className="ar">مجموع النتائج</span>
                      <span className="id">Total Nilai</span>
                    </td>
                    <td colSpan={2} className="ring-val total">{angkaArab(data.total)}</td>
                    <td className="deskripsi">
                      <span className="ar">وصف تقدم التعلم</span>
                      <span className="id">Deskripsi Kemajuan Belajar</span>
                    </td>
                    <td className="predikat">
                      <span className="ar">المسند القيمة</span>
                      <span className="id">Predikat</span>
                    </td>
                  </tr>
                  <tr>
                    <td className="no">{angkaArab(data.mapel.length + 2)}</td>
                    <td colSpan={2} className="ring-label">
                      <span className="ar">التعادل</span>
                      <span className="id">Rata-Rata</span>
                    </td>
                    <td colSpan={2} className="ring-val">
                      {angkaArab(data.rata2)} ({angkaArab(data.rata2_bulat)})
                    </td>
                    <td className="deskripsi" rowSpan={2}>
                      <span className="isi-deskripsi">{predikat.deskripsi}</span>
                    </td>
                    <td className="predikat">{predikat.predikat_ar}</td>
                  </tr>
                  <tr>
                    <td className="no">{angkaArab(data.mapel.length + 3)}</td>
                    <td colSpan={2} className="ring-label peringkat">
                      <span className="ar">المرتبة</span>
                      <span className="id">Peringkat</span>
                    </td>
                    <td colSpan={2} className="ring-val">{angkaArab(data.peringkat)}</td>
                    <td className="predikat">{predikat.predikat_id}</td>
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
                    <th style={{ width: "11%" }}>
                      <span className="th-ar">المهارة</span>
                    </th>
                    <th colSpan={2}>
                      <span className="th-ar">وظيفة التنمية الذاتية</span>
                    </th>
                  </tr>
                  <tr>
                    <th>
                      <span className="th-id">Nilai</span>
                    </th>
                    <th colSpan={2}>
                      <span className="th-id">Kegiatan Pengembangan Diri</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="nilai-isi">{hurufArab(data.pembiasaan)}</td>
                    <td className="id" style={{ width: "46.5%" }}>Pembiasaan Pagi</td>
                    <td className="ar" style={{ width: "42.5%" }}>تعويد بالغدوة</td>
                  </tr>
                </tbody>
              </table>

              {/* Praktik & Hafalan */}
              <table className="sub">
                <thead>
                  <tr>
                    <th style={{ width: "11.5%" }}>
                      <span className="th-ar">المهارة</span>
                    </th>
                    <th style={{ width: "34.5%" }}>
                      <span className="th-ar">ألمعلومة</span>
                    </th>
                    <th colSpan={2}>
                      <span className="th-ar">الممارسة والمحفوظات وقرائة الكتب</span>
                    </th>
                  </tr>
                  <tr>
                    <th>
                      <span className="th-id">Nilai</span>
                    </th>
                    <th>
                      <span className="th-id">Keterangan</span>
                    </th>
                    <th colSpan={2}>
                      <span className="th-id">Praktik, Hafalan dan Pembacaan Kitab</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data.praktik.map((p, idx) => (
                    <tr key={idx}>
                      <td className="nilai-isi">{hurufArab(p.nilai)}</td>
                      <td className="ket-materi" style={{ width: "34.5%" }}>{p.keterangan || "-"}</td>
                      <td className="id" style={{ width: "27.5%" }}>{p.nama_id}</td>
                      <td className="ar" style={{ width: "26.5%" }}>{p.nama_ar || ""}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Sikap Sehari-hari */}
              <table className="sub">
                <thead>
                  <tr>
                    <th style={{ width: "11%" }}>
                      <span className="th-ar">المهارة</span>
                    </th>
                    <th colSpan={2}>
                      <span className="th-ar">المعاملة اليومية</span>
                    </th>
                  </tr>
                  <tr>
                    <th>
                      <span className="th-id">Nilai</span>
                    </th>
                    <th colSpan={2}>
                      <span className="th-id">Sikap Sehari-hari</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="nilai-isi">{hurufArab(data.sikap?.akhlaq)}</td>
                    <td className="id" style={{ width: "46.5%" }}>Akhlaq</td>
                    <td className="ar" style={{ width: "42.5%" }}>اخلاق</td>
                  </tr>
                  <tr>
                    <td className="nilai-isi">{hurufArab(data.sikap?.kepribadian)}</td>
                    <td className="id">Kepribadian</td>
                    <td className="ar">شخصية</td>
                  </tr>
                </tbody>
              </table>

              {/* Ketidakhadiran */}
              <table className="sub">
                <thead>
                  <tr>
                    <th style={{ width: "41.5%" }}>
                      <span className="th-ar">معلومات</span>
                    </th>
                    <th style={{ width: "15.5%" }}>
                      <span className="th-ar">ايام</span>
                    </th>
                    <th colSpan={2}>
                      <span className="th-ar">الغياب</span>
                    </th>
                  </tr>
                  <tr>
                    <th>
                      <span className="th-id">Keterangan</span>
                    </th>
                    <th>
                      <span className="th-id">Hari</span>
                    </th>
                    <th colSpan={2}>
                      <span className="th-id">Ketidakhadiran</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td />
                    <td className="nilai-isi">{angkaArab(data.kehadiran?.sakit ?? 0)}</td>
                    <td className="id" style={{ width: "22%" }}>Sakit</td>
                    <td className="ar" style={{ width: "21%" }}>المرض</td>
                  </tr>
                  <tr>
                    <td />
                    <td className="nilai-isi">{angkaArab(data.kehadiran?.izin ?? 0)}</td>
                    <td className="id">Izin</td>
                    <td className="ar">الرخصة</td>
                  </tr>
                  <tr>
                    <td />
                    <td className="nilai-isi">{angkaArab(data.kehadiran?.alpa ?? 0)}</td>
                    <td className="id">Alpa</td>
                    <td className="ar">لاهمال</td>
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
                    <span className="id">Wali Murid</span>
                    <div className="space" />
                    ( .............................. )
                  </div>
                  <div className="col">
                    <span className="ar">ولي القسم</span>
                    <br />
                    <span className="id">Wali Kelas</span>
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