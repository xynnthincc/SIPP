<!DOCTYPE html>
<html lang="id" dir="ltr">
<head>
    <meta charset="utf-8">
    <title>Rapor - {{ $rapor['siswa']['nama'] ?? 'Siswa' }}</title>
    <style>
        @page {
            size: A4 portrait;
            margin: 14mm 12mm 14mm 12mm;
        }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
            font-family: 'Times New Roman', 'Traditional Arabic', serif;
            font-size: 11pt;
            color: #000;
            line-height: 1.3;
            position: relative;
        }

        /* ── watermark ── */
        .watermark {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) rotate(-30deg);
            font-size: 38pt;
            color: rgba(0,0,0,0.04);
            white-space: nowrap;
            z-index: -1;
            font-weight: bold;
            letter-spacing: 6px;
            pointer-events: none;
        }

        /* ── logo ── */
        .logo-center {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 200px;
            height: 200px;
            opacity: 0.06;
            z-index: -1;
            pointer-events: none;
        }

        /* ── page breaks ── */
        .page-break { page-break-before: always; }

        /* ── shared table styling ── */
        table {
            width: 100%;
            border-collapse: collapse;
        }
        th, td {
            border: 1px solid #000;
            padding: 3px 5px;
            vertical-align: middle;
        }

        /* ── Arabic helpers ── */
        .ar {
            direction: rtl;
            text-align: right;
            font-family: 'Traditional Arabic', 'Amiri', 'Times New Roman', serif;
            font-size: 12pt;
        }
        .ar-center {
            direction: rtl;
            text-align: center;
            font-family: 'Traditional Arabic', 'Amiri', 'Times New Roman', serif;
            font-size: 12pt;
        }
        .ar-sm {
            direction: rtl;
            font-family: 'Traditional Arabic', 'Amiri', 'Times New Roman', serif;
            font-size: 10pt;
        }
        .id { font-size: 9pt; }
        .center { text-align: center; }
        .right  { text-align: right; }
        .bold   { font-weight: bold; }
        .sm     { font-size: 9pt; }

        /* ── header info table (no outer border) ── */
        .info-table td, .info-table th {
            border: none;
            padding: 1px 4px;
            vertical-align: top;
            font-size: 10.5pt;
        }
        .info-table .label-ar {
            text-align: right;
            direction: rtl;
            font-family: 'Traditional Arabic', 'Amiri', serif;
            font-size: 12pt;
            width: 130px;
        }
        .info-table .label-id {
            font-size: 9pt;
            color: #333;
            width: 100px;
        }
        .info-table .val {
            font-weight: bold;
        }
        .info-table .sep {
            width: 10px;
            text-align: center;
        }

        /* ── mapel table ── */
        .mapel-table th {
            background: transparent;
            text-align: center;
            font-weight: bold;
        }
        .mapel-table td {
            font-size: 10pt;
        }
        .mapel-table .no-col   { width: 32px; text-align: center; }
        .mapel-table .mapel-col { }
        .mapel-table .kkm-col  { width: 46px; text-align: center; }
        .mapel-table .angka-col { width: 58px; text-align: center; }
        .mapel-table .huruf-col { width: 90px; text-align: center; }
        .mapel-table .ket-col   { width: 90px; text-align: center; }

        /* ── summary section ── */
        .summary-table td, .summary-table th {
            font-size: 10pt;
            padding: 3px 5px;
        }

        /* ── section header ── */
        .section-header {
            background: #e8e8e8;
            text-align: center;
            font-weight: bold;
            padding: 4px;
        }
        .section-header .ar-title {
            direction: rtl;
            font-family: 'Traditional Arabic', 'Amiri', serif;
            font-size: 13pt;
        }
        .section-header .id-title {
            font-size: 9pt;
        }

        /* ── ttd ── */
        .ttd-table td {
            border: none;
            text-align: center;
            vertical-align: top;
            padding-top: 6px;
        }
        .ttd-table .nama-ttd {
            margin-top: 60px;
            display: inline-block;
        }
    </style>
</head>
<body>

{{-- Watermark --}}
<div class="watermark">
    PONDOK PESANTREN DARUSSURUR YAYASAN PONDOK PESANTREN DARUSSURUR
</div>

{{-- ══════════════════════════════════════════════ --}}
{{-- ═══════════════  PAGE 1  ═══════════════════ --}}
{{-- ══════════════════════════════════════════════ --}}

{{-- ── Header info ── --}}
<table class="info-table" style="margin-bottom: 8px;">
    <tr>
        <td class="label-ar">اسم المدرسة</td>
        <td class="label-id">Nama Sekolah</td>
        <td class="sep">:</td>
        <td class="val" style="width:34%">{{ $rapor['sekolah']['nama_sekolah'] ?? '-' }}</td>
        <td class="label-ar" style="width:60px">فصم</td>
        <td class="label-id">Kelas</td>
        <td class="sep">:</td>
        <td class="val">{{ $rapor['kelas']['nama'] ?? '-' }}</td>
    </tr>
    <tr>
        <td class="label-ar">عنوان المدرسة</td>
        <td class="label-id">Alamat Sekolah</td>
        <td class="sep">:</td>
        <td class="val">{{ $rapor['sekolah']['alamat'] ?? '-' }}@isset($rapor['sekolah']['kota_kabupaten']), {{ $rapor['sekolah']['kota_kabupaten'] }}@endisset</td>
        <td class="label-ar">نصف السنة</td>
        <td class="label-id">Semester</td>
        <td class="sep">:</td>
        <td class="val">{{ $rapor['semester']['nama'] ?? '-' }}</td>
    </tr>
    <tr>
        <td class="label-ar">اسم الطالب/الطالبة</td>
        <td class="label-id">Nama Siswa</td>
        <td class="sep">:</td>
        <td class="val" style="text-transform: uppercase;">{{ $rapor['siswa']['nama'] ?? '-' }}</td>
        <td class="label-ar">سنة الدراسة</td>
        <td class="label-id">Tahun Pelajaran</td>
        <td class="sep">:</td>
        <td class="val">{{ $rapor['semester']['tahun'] ?? '-' }}</td>
    </tr>
</table>

<hr style="border:1px solid #000; margin-bottom:8px;">

{{-- ── Mapel table (Hasil Pembelajaran) ── --}}
<table class="mapel-table">
    <thead>
        <tr>
            {{-- Header row 1: Arabic labels --}}
            <th class="no-col" rowspan="2">
                <span class="ar-center">رقم</span><br>
                <span class="id">No</span>
            </th>
            <th class="mapel-col" rowspan="2">
                <span class="ar-center">عنوان الدروس</span><br>
                <span class="id">Mata Pelajaran</span>
            </th>
            <th class="kkm-col" rowspan="2">
                <span class="ar-center">النهائي</span><br>
                <span class="id">KKM</span>
            </th>
            <th colspan="2" style="text-align:center;">
                <span class="ar-center">المهارة</span><br>
                <span class="id">Nilai</span>
            </th>
            <th class="ket-col" rowspan="2">
                <span class="ar-center">معايير الطيمة</span><br>
                <span class="id">Kriteria Penilaian</span>
            </th>
        </tr>
        <tr>
            <th class="angka-col">
                <span class="ar-center">شخصية</span><br>
                <span class="id">Angka</span>
            </th>
            <th class="huruf-col">
                <span class="ar-center">حروف</span><br>
                <span class="id">Huruf</span>
            </th>
        </tr>
    </thead>
    <tbody>
        @foreach ($rapor['mapel'] as $m)
            <tr>
                <td class="center">{{ $loop->iteration }}</td>
                <td>
                    <span>{{ $m['nama_id'] }}</span>
                    @if ($m['nama_ar'])
                        <span class="ar" style="float:right;">{{ $m['nama_ar'] }}</span>
                    @endif
                </td>
                <td class="center">{{ $m['kkm'] !== null ? $m['kkm'] : '' }}</td>
                <td class="center ar-center" style="font-size:12pt;">{{ $m['angka_arab'] ?? '' }}</td>
                <td class="center ar-center" style="font-size:11pt;">{{ $m['terbilang'] ?? '' }}</td>
                <td class="center ar-center" style="font-size:11pt;">{{ $m['ket_nilai'] ?? '' }}</td>
            </tr>
        @endforeach
    </tbody>
</table>

{{-- ── Summary: Total, Rata-rata, Peringkat, Predikat, Deskripsi ── --}}
<table class="summary-table" style="margin-top:-1px;">
    <tr>
        <td style="width:32px; text-align:center; border-right:1px solid #000;">
            <span class="ar-sm">{{ \App\Support\ArabBilangan::angkaArab($rapor['total']) }}</span>
        </td>
        <td style="border-right:1px solid #000;">
            <span class="ar" style="float:right;">مجموع النتائج</span>
            <span class="id">Total Nilai</span>
        </td>
        <td colspan="2" rowspan="3" style="vertical-align:top; padding:5px 8px;">
            <div style="margin-bottom:4px;">
                <span class="ar" style="float:right;">المستوى الطيمة: {{ $rapor['predikat']['predikat_ar'] ?? '' }}</span>
                <span class="bold" style="font-size:10pt;">/ {{ $rapor['predikat']['predikat_id'] ?? '' }}</span>
            </div>
            <div style="margin-bottom:4px;">
                <span class="ar" style="float:right;">وصف تقدم التعلم</span>
            </div>
            <div style="font-size:9pt;">
                <span class="id">Deskripsi Kemajuan Belajar:</span><br>
                <span class="bold" style="font-size:9pt;">{{ $rapor['predikat']['deskripsi'] ?? '' }}</span>
            </div>
        </td>
    </tr>
    <tr>
        <td style="text-align:center;">
            <span class="ar-sm">{{ \App\Support\ArabBilangan::angkaArab($rapor['rata2_bulat']) }}</span>
        </td>
        <td>
            <span class="ar" style="float:right;">المعدل</span>
            <span class="id">Rata-Rata</span>
        </td>
    </tr>
    <tr>
        <td style="text-align:center;">
            <span class="ar-sm">{{ \App\Support\ArabBilangan::angkaArab($rapor['peringkat'] ?? 0) }}</span>
        </td>
        <td>
            <span class="ar" style="float:right;">المرتبة</span>
            <span class="id">Peringkat</span>
        </td>
    </tr>
</table>


{{-- ══════════════════════════════════════════════ --}}
{{-- ═══════════════  PAGE 2  ═══════════════════ --}}
{{-- ══════════════════════════════════════════════ --}}
<div class="page-break"></div>

{{-- ── Kegiatan Pengembangan Diri (Pembiasaan) ── --}}
<table>
    <tr>
        <td class="section-header" colspan="3">
            <span class="ar-title">وظيفة التنمية الذاتية</span><br>
            <span class="id-title">Kegiatan Pengembangan Diri</span>
        </td>
        <td style="text-align:center; width:100px;">
            <span class="ar-center">المهارة</span><br>
            <span class="id">Nilai</span>
        </td>
    </tr>
    <tr>
        <td colspan="3">
            <span class="ar" style="float:right;">تعويد بالخيرة</span>
            <span class="id">Pembiasaan Pos.</span>
        </td>
        <td class="center">
            <span class="ar-center" style="font-size:12pt;">{{ $rapor['pembiasaan'] !== null ? \App\Support\ArabBilangan::angkaArab($rapor['pembiasaan']) : '' }}</span>
        </td>
    </tr>
</table>

{{-- ── Praktik, Hafalan dan Pembacaan Kitab ── --}}
<table style="margin-top:10px;">
    <tr>
        <td class="section-header" style="width:42%;">
            <span class="ar-title">المماراسة والمحفوظات وقراءة الكتب</span><br>
            <span class="id-title">Praktik, Hafalan dan Pembacaan Kitab</span>
        </td>
        <td class="section-header" style="width:38%;">
            <span class="ar-title">المعلومات</span><br>
            <span class="id-title">Keterangan</span>
        </td>
        <td class="section-header" style="width:20%;">
            <span class="ar-title">المهارة</span><br>
            <span class="id-title">Nilai</span>
        </td>
    </tr>
    @if (! empty($rapor['praktik']))
        @foreach ($rapor['praktik'] as $item)
            <tr>
                <td>
                    <span class="ar" style="float:right;">{{ $item['nama_ar'] ?? '' }}</span>
                    <span class="id">{{ $item['nama_id'] }}</span>
                </td>
                <td class="sm">{{ $item['keterangan'] ?? '' }}</td>
                <td class="center">
                    @if ($item['nilai'] !== null)
                        <span class="ar-center" style="font-size:12pt;">{{ \App\Support\ArabBilangan::angkaArab($item['nilai']) }}</span>
                    @endif
                </td>
            </tr>
        @endforeach
    @else
        <tr>
            <td>&nbsp;</td>
            <td>&nbsp;</td>
            <td>&nbsp;</td>
        </tr>
    @endif
</table>

{{-- ── Sikap Sehari-hari ── --}}
<table style="margin-top:10px;">
    <tr>
        <td class="section-header" colspan="2">
            <span class="ar-title">المعاملة اليومية</span><br>
            <span class="id-title">Sikap Sehari-hari</span>
        </td>
        <td class="section-header" style="width:20%;">
            <span class="ar-title">المهارة</span><br>
            <span class="id-title">Nilai</span>
        </td>
    </tr>
    <tr>
        <td colspan="2">
            <span class="ar" style="float:right;">أخلاقي</span>
            <span class="id">Akhlaq</span>
        </td>
        <td class="center">{{ $rapor['sikap']['akhlaq'] ?? '' }}</td>
    </tr>
    <tr>
        <td colspan="2">
            <span class="ar" style="float:right;">شخصية</span>
            <span class="id">Kepribadian</span>
        </td>
        <td class="center">{{ $rapor['sikap']['kepribadian'] ?? '' }}</td>
    </tr>
</table>

{{-- ── Ketidakhadiran ── --}}
<table style="margin-top:10px;">
    <tr>
        <td class="section-header" colspan="2">
            <span class="ar-title">الغياب</span><br>
            <span class="id-title">Ketidakhadiran</span>
        </td>
        <td class="section-header" style="width:20%;">
            <span class="ar-title">أيام</span><br>
            <span class="id-title">Hari</span>
        </td>
        <td class="section-header" style="width:12%;">
            <span class="ar-title">رقم</span><br>
            <span class="id-title">No</span>
        </td>
    </tr>
    <tr>
        <td colspan="2">
            <span class="ar" style="float:right;">المرض</span>
            <span class="id">Sakit</span>
        </td>
        <td class="center">{{ $rapor['kehadiran']['sakit'] ?? 0 }}</td>
        <td class="center">١</td>
    </tr>
    <tr>
        <td colspan="2">
            <span class="ar" style="float:right;">الرخصة</span>
            <span class="id">Izin</span>
        </td>
        <td class="center">{{ $rapor['kehadiran']['izin'] ?? 0 }}</td>
        <td class="center">٢</td>
    </tr>
    <tr>
        <td colspan="2">
            <span class="ar" style="float:right;">بإهمال</span>
            <span class="id">Alpa</span>
        </td>
        <td class="center">{{ $rapor['kehadiran']['alpa'] ?? 0 }}</td>
        <td class="center">٣</td>
    </tr>
</table>

{{-- ── TTD (Wali Murid & Wali Kelas) ── --}}
<div style="margin-top:24px;">
    @if (! empty($rapor['semester']['tempat_tanggal_rapot']))
        <div style="text-align:right; margin-bottom:10px; font-size:10pt;">
            {{ $rapor['semester']['tempat_tanggal_rapot'] }}
        </div>
    @endif

    <table class="ttd-table" style="width:100%;">
        <tr>
            <td style="width:50%;">
                <span class="ar">ولي الطلاب</span><br>
                <span class="id">Wali Murid</span>

                <div class="nama-ttd">
                    <span>(____________________)</span>
                </div>
            </td>
            <td style="width:50%;">
                <span class="ar">ولي الفصل</span><br>
                <span class="id">Wali Kelas</span>

                <div class="nama-ttd">
                    <span style="text-decoration:underline;">( {{ $rapor['wali_kelas'] ?? '____________________' }} )</span>
                </div>
            </td>
        </tr>
    </table>
</div>

</body>
</html>