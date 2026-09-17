"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import { labelKelas, labelTingkat } from "@/lib/kelas";
import { Sekolah, Siswa } from "@/lib/types";
import { angkaArab } from "@/lib/arab";
import { Button, Alert, Skeleton } from "@/components/ui";

export default function CetakBiodataPage() {
  return (
    <Suspense fallback={<Skeleton className="h-96 w-full max-w-4xl mx-auto my-6" />}>
      <CetakBiodataView />
    </Suspense>
  );
}

function CetakBiodataView() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id") || searchParams.get("siswa_id");
  const router = useRouter();

  const [siswa, setSiswa] = useState<Siswa | null>(null);
  const [sekolah, setSekolah] = useState<Sekolah | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const muat = useCallback(() => {
    if (!id) return;
    Promise.all([
      api.get<Siswa>(`/siswa/${id}`),
      api.get<Sekolah>("/sekolah"),
    ])
      .then(([resSiswa, resSekolah]) => {
        setSiswa(resSiswa.data);
        setSekolah(resSekolah.data);
        setLoading(false);
      })
      .catch((err: unknown) => {
        const pesan = (err as { response?: { data?: { message?: string } } })?.response?.data;
        setError(pesan?.message ?? "Gagal memuat data biodata siswa.");
        setLoading(false);
      });
  }, [id]);

  useEffect(() => {
    muat();
  }, [muat]);

  function formatTanggal(tglStr: string | null | undefined): string {
    if (!tglStr) return "-";
    const d = new Date(tglStr);
    if (isNaN(d.getTime())) return tglStr;
    return d.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }

  const ttl = [siswa?.tempat_lahir, formatTanggal(siswa?.tanggal_lahir)]
    .filter(Boolean)
    .join(", ") || "-";

  const jk =
    siswa?.jenis_kelamin === "L"
      ? "Laki-laki"
      : siswa?.jenis_kelamin === "P"
      ? "Perempuan"
      : "-";

  const alamatOrtu = siswa?.alamat_ortu || siswa?.alamat || "-";
  const noTelpOrtu =
    siswa?.no_wa_ayah || siswa?.no_telp_ibu || siswa?.no_telp || "-";

  let noUrut = 1;

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
              table.biodata tr {
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

            .kop-judul {
              text-align: center;
              margin-bottom: 20px;
            }
            .kop-judul .arab-besar {
              font-size: 18px;
              font-weight: bold;
              direction: rtl;
              margin-bottom: 4px;
            }
            .kop-judul .judul-utama {
              font-size: 16px;
              font-weight: bold;
              letter-spacing: .5px;
            }

            table.biodata {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 10px;
            }
            table.biodata td {
              padding: 6px 8px;
              font-size: 13px;
              vertical-align: bottom;
              border: none;
            }
            table.biodata td.label-ar {
              width: 20%;
              direction: rtl;
              text-align: right;
              font-weight: bold;
              white-space: nowrap;
            }
            table.biodata td.label-id {
              width: 22%;
              font-style: italic;
              color: #333;
              white-space: nowrap;
            }
            table.biodata td.isi {
              width: 50%;
              font-weight: bold;
            }
            table.biodata td.no {
              width: 8%;
              text-align: right;
              direction: rtl;
              color: #444;
              white-space: nowrap;
            }
            table.biodata tr.section-title td {
              font-weight: bold;
              font-size: 12px;
              color: #124a33;
              padding-top: 16px;
            }

            .footer-biodata {
              margin-top: 36px;
              display: flex;
              align-items: flex-end;
              justify-content: space-between;
              padding: 0 8px;
            }
            .footer-biodata .ttd-blok {
              font-size: 12.5px;
            }
            .footer-biodata .ttd-blok .tanggal {
              margin-bottom: 6px;
            }
            .footer-biodata .ttd-blok .jabatan {
              margin-bottom: 60px;
            }
            .footer-biodata .ttd-blok .nama {
              font-weight: bold;
              text-decoration: underline;
            }
            .footer-biodata .ttd-blok .nip {
              font-size: 11px;
            }

            .foto-siswa-box {
              width: 100px;
              height: 130px;
              border: 1px solid #000;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 11px;
              text-align: center;
              color: #666;
              overflow: hidden;
              flex-shrink: 0;
            }
            .foto-siswa-box img {
              width: 100%;
              height: 100%;
              object-fit: cover;
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
            Pratinjau Biodata Peserta Didik — {siswa?.nama ?? "Memuat…"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {siswa && (
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push(`/rapor-cetak?siswa_id=${siswa.id}`)}
            >
              Cetak Rapor
            </Button>
          )}
          <Button onClick={() => window.print()}>
            Cetak / Simpan sebagai PDF
          </Button>
        </div>
      </div>

      <div className="cetak-wrap bg-white shadow-xl border border-slate-200 max-w-[210mm] mx-auto my-6 p-8 print:p-0 print:border-none print:shadow-none print:my-0">
        {loading && id ? (
          <Skeleton className="h-96 w-full" />
        ) : !id ? (
          <div className="py-10">
            <Alert variant="danger">
              Parameter id siswa tidak ditemukan. Silakan buka melalui menu Data Siswa.
            </Alert>
          </div>
        ) : error ? (
          <div className="py-10">
            <Alert variant="danger" onClose={() => setError(null)}>
              {error}
            </Alert>
          </div>
        ) : siswa && sekolah ? (
          <div className="lembar">
            <div className="kop-judul">
              <div className="arab-besar">معلومات حول المتعلمين اللاحق</div>
              <div className="judul-utama">KETERANGAN/BIODATA PESERTA DIDIK</div>
            </div>

            <table className="biodata">
              <tbody>
                <tr>
                  <td className="isi">{siswa.nama || "-"}</td>
                  <td className="label-id">Nama Siswa</td>
                  <td className="label-ar">اسم الطالب</td>
                  <td className="no">{angkaArab(noUrut++)}.</td>
                </tr>
                <tr>
                  <td className="isi">{siswa.nis || "-"}</td>
                  <td className="label-id">Nomor Induk</td>
                  <td className="label-ar">رقم دفتر القيد</td>
                  <td className="no">{angkaArab(noUrut++)}.</td>
                </tr>
                <tr>
                  <td className="isi">{ttl}</td>
                  <td className="label-id">Tempat Tanggal Lahir</td>
                  <td className="label-ar">تاريخ الميلاد</td>
                  <td className="no">{angkaArab(noUrut++)}.</td>
                </tr>
                <tr>
                  <td className="isi">{jk}</td>
                  <td className="label-id">Jenis Kelamin</td>
                  <td className="label-ar">جنس</td>
                  <td className="no">{angkaArab(noUrut++)}.</td>
                </tr>
                <tr>
                  <td className="isi">{siswa.agama || "Islam"}</td>
                  <td className="label-id">Agama</td>
                  <td className="label-ar">دين</td>
                  <td className="no">{angkaArab(noUrut++)}.</td>
                </tr>
                <tr>
                  <td className="isi">{siswa.status_anak || "-"}</td>
                  <td className="label-id">Status dalam Keluarga</td>
                  <td className="label-ar">مركز في الأسرة</td>
                  <td className="no">{angkaArab(noUrut++)}.</td>
                </tr>
                <tr>
                  <td className="isi">{siswa.anak_ke || "-"}</td>
                  <td className="label-id">Anak Ke</td>
                  <td className="label-ar">ترتيب الأولاد</td>
                  <td className="no">{angkaArab(noUrut++)}.</td>
                </tr>
                <tr>
                  <td className="isi">{siswa.alamat || "-"}</td>
                  <td className="label-id">Alamat Siswa</td>
                  <td className="label-ar">عنوان الطالب</td>
                  <td className="no">{angkaArab(noUrut++)}.</td>
                </tr>
                <tr>
                  <td className="isi">{siswa.no_telp || "-"}</td>
                  <td className="label-id">Nomor Telpon</td>
                  <td className="label-ar">تليفون</td>
                  <td className="no">{angkaArab(noUrut++)}.</td>
                </tr>
                <tr>
                  <td className="isi">{siswa.sekolah_asal || "-"}</td>
                  <td className="label-id">Sekolah Asal</td>
                  <td className="label-ar">أصل المدرسة</td>
                  <td className="no">{angkaArab(noUrut++)}.</td>
                </tr>
                <tr>
                  <td className="isi">
                    {siswa.kelas_rombel
                      ? `${labelKelas(siswa.kelas_rombel.nama)} (${labelTingkat(siswa.kelas_rombel.tingkat)})`
                      : siswa.diterima_kelas || "-"}
                  </td>
                  <td className="label-id">Diterima di Kelas</td>
                  <td className="label-ar">يقبل في الفصل</td>
                  <td className="no">{angkaArab(noUrut++)}.</td>
                </tr>
                <tr>
                  <td className="isi">{formatTanggal(siswa.diterima_tanggal)}</td>
                  <td className="label-id">Pada Tanggal</td>
                  <td className="label-ar">التاريخ</td>
                  <td className="no">{angkaArab(noUrut++)}.</td>
                </tr>

                <tr className="section-title">
                  <td colSpan={4}>Nama Orang Tua / اسم الوالدين</td>
                </tr>
                <tr>
                  <td className="isi">{siswa.nama_ayah || "-"}</td>
                  <td className="label-id">Ayah</td>
                  <td className="label-ar">الأب</td>
                  <td className="no">{angkaArab(noUrut++)}.</td>
                </tr>
                <tr>
                  <td className="isi">{siswa.nama_ibu || "-"}</td>
                  <td className="label-id">Ibu</td>
                  <td className="label-ar">الأم</td>
                  <td className="no">{angkaArab(noUrut++)}.</td>
                </tr>
                <tr>
                  <td className="isi">{alamatOrtu}</td>
                  <td className="label-id">Alamat Orang Tua</td>
                  <td className="label-ar">عنوان الوالدين</td>
                  <td className="no">{angkaArab(noUrut++)}.</td>
                </tr>
                <tr>
                  <td className="isi">{noTelpOrtu}</td>
                  <td className="label-id">Nomor Telpon</td>
                  <td className="label-ar">تليفون</td>
                  <td className="no">{angkaArab(noUrut++)}.</td>
                </tr>

                <tr className="section-title">
                  <td colSpan={4}>Pekerjaan Orang Tua / وظيفة الوالدين</td>
                </tr>
                <tr>
                  <td className="isi">{siswa.profesi_ayah || "-"}</td>
                  <td className="label-id">Ayah</td>
                  <td className="label-ar">الأب</td>
                  <td className="no">{angkaArab(noUrut++)}.</td>
                </tr>
                <tr>
                  <td className="isi">{siswa.profesi_ibu || "-"}</td>
                  <td className="label-id">Ibu</td>
                  <td className="label-ar">الأم</td>
                  <td className="no">{angkaArab(noUrut++)}.</td>
                </tr>

                {siswa.nama_wali ? (
                  <>
                    <tr className="section-title">
                      <td colSpan={4}>Data Wali / معلومات الولي</td>
                    </tr>
                    <tr>
                      <td className="isi">{siswa.nama_wali}</td>
                      <td className="label-id">Nama Wali</td>
                      <td className="label-ar">اسم الولي</td>
                      <td className="no">{angkaArab(noUrut++)}.</td>
                    </tr>
                    <tr>
                      <td className="isi">{siswa.alamat_wali || "-"}</td>
                      <td className="label-id">Alamat Wali</td>
                      <td className="label-ar">عنوان الولي</td>
                      <td className="no">{angkaArab(noUrut++)}.</td>
                    </tr>
                    <tr>
                      <td className="isi">{siswa.no_telp_wali || "-"}</td>
                      <td className="label-id">Nomor Telpon</td>
                      <td className="label-ar">تليفون</td>
                      <td className="no">{angkaArab(noUrut++)}.</td>
                    </tr>
                    <tr>
                      <td className="isi">{siswa.pekerjaan_wali || "-"}</td>
                      <td className="label-id">Pekerjaan Wali</td>
                      <td className="label-ar">وظيفة الولي</td>
                      <td className="no">{angkaArab(noUrut++)}.</td>
                    </tr>
                  </>
                ) : null}
              </tbody>
            </table>

            <div className="footer-biodata">
              <div className="ttd-blok">
                <div className="tanggal">
                  {sekolah.kota_kabupaten || "Cimahi"},{" "}
                  {new Date().toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </div>
                <div className="jabatan">Kepala Sekolah</div>
                <div className="nama">
                  {sekolah.kepala_sekolah || "............................."}
                </div>
                {sekolah.nip_kepala_sekolah ? (
                  <div className="nip">NIP. {sekolah.nip_kepala_sekolah}</div>
                ) : null}
              </div>
              <div className="foto-siswa-box">
                {siswa.foto ? (
                  <img
                    src={siswa.foto.startsWith("http") ? siswa.foto : `/storage/${siswa.foto}`}
                    alt="Foto Siswa"
                  />
                ) : (
                  <>
                    Pas Foto<br />3x4
                  </>
                )}
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
