<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="utf-8">
    <title>Laporan Hasil Belajar{{ ($rapor['semester']['jenis'] ?? 'Akhir') === 'Sementara' ? ' Sementara' : '' }}</title>
    <style>
        * { box-sizing: border-box; }
        body { font-family: 'Segoe UI', 'Arial', sans-serif; font-size: 11px; margin: 0; color: #111; }
        h1 { font-size: 16px; margin: 4px 0; }
        h2 { font-size: 13px; margin: 12px 0 6px; text-align: center; border-bottom: 2px solid #0f766e; padding-bottom: 4px; }
        .header { text-align: center; border-bottom: 2px solid #0f766e; padding-bottom: 6px; margin-bottom: 12px; }
        .muted { color: #555; margin: 0; }
        table { width: 100%; border-collapse: collapse; margin: 6px 0 12px; }
        th, td { border: 1px solid #999; padding: 4px 6px; text-align: left; }
        th { background: #f0fdfa; font-weight: 600; }
        .ar { direction: rtl; font-family: 'Traditional Arabic', 'Amiri', 'Times New Roman', serif; }
        .terbilang { font-family: 'Traditional Arabic', 'Amiri', 'Times New Roman', serif; }
        .info { display: flex; flex-wrap: wrap; gap: 8px 24px; margin-bottom: 10px; }
        .info span { display: inline-block; }
        .label { color: #555; }
        .footer { margin-top: 16px; }
        .ttd { margin-top: 48px; text-align: center; }
        .ttd .nama { font-weight: 600; margin-top: 70px; text-decoration: underline; }
        .keterangan { min-height: 14px; font-size: 10px; color: #333; }
        .predikat { font-weight: 600; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Laporan Hasil Belajar{{ ($rapor['semester']['jenis'] ?? 'Akhir') === 'Sementara' ? ' — SEMENTARA' : '' }}</h1>
        <p class="muted">{{ $rapor['sekolah']['nama_sekolah'] }}</p>
        <p class="muted">
            {{ $rapor['sekolah']['alamat'] ?? '' }}@isset($rapor['sekolah']['kota_kabupaten']) , {{ $rapor['sekolah']['kota_kabupaten'] }}@endisset
        </p>
    </div>

    <div class="info">
        <span><span class="label">Nama:</span> <b>{{ $rapor['siswa']['nama'] }}</b></span>
        <span><span class="label">NIS:</span> {{ $rapor['siswa']['nis'] }}</span>
        <span><span class="label">Kelas:</span> {{ $rapor['kelas']['nama'] ?? '-' }}@isset($rapor['kelas']['tingkat']) (Tingkat {{ $rapor['kelas']['tingkat'] }})@endisset</span>
        <span><span class="label">Wali Kelas:</span> {{ $rapor['wali_kelas'] ?? '-' }}</span>
        <span><span class="label">Semester:</span> {{ $rapor['semester']['nama'] }}{{ ($rapor['semester']['jenis'] ?? 'Akhir') === 'Sementara' ? ' (Sementara)' : '' }}</span>
        <span><span class="label">Tahun:</span> {{ $rapor['semester']['tahun'] }}</span>
    </div>

    <h2>Hasil Pembelajaran</h2>
    <table>
        <thead>
            <tr>
                <th style="width:38px">No</th>
                <th>Mata Pelajaran</th>
                <th style="width:60px">KKM</th>
                <th style="width:60px">Nilai</th>
                <th style="width:80px">Predikat</th>
            </tr>
        </thead>
        <tbody>
            @foreach ($rapor['mapel'] as $m)
                <tr>
                    <td>{{ $loop->iteration }}</td>
                    <td>
                        {{ $m['nama_id'] }}
                        @if ($m['nama_ar'])
                            <span class="ar">{{ $m['nama_ar'] }}</span>
                        @endif
                    </td>
                    <td>{{ $m['kkm'] ?? '-' }}</td>
                    <td>{{ $m['angka_arab'] ?? '-' }}</td>
                    <td class="terbilang">{{ $m['ket_nilai'] ?? '-' }}</td>
                </tr>
            @endforeach
        </tbody>
        <tfoot>
            <tr>
                <th colspan="3">Nilai Rata-rata</th>
                <th>{{ $rapor['rata2_bulat'] }}</th>
                <th class="terbilang">{{ $rapor['predikat'] ?? '' }}</th>
            </tr>
        </tfoot>
    </table>

    @if (! empty($rapor['praktik']))
        <h2>Hasil Praktik</h2>
        <table>
            <thead>
                <tr>
                    <th style="width:38px">No</th>
                    <th>Mata Pelajaran Praktik</th>
                    <th style="width:60px">Nilai</th>
                    <th>Keterangan</th>
                </tr>
            </thead>
            <tbody>
                @foreach ($rapor['praktik'] as $item)
                    <tr>
                        <td>{{ $loop->iteration }}</td>
                        <td>{{ $item['nama_id'] }} @if ($item['nama_ar'])<span class="ar">{{ $item['nama_ar'] }}</span>@endif</td>
                        <td>{{ $item['nilai'] ?? '-' }}</td>
                        <td class="keterangan">{{ $item['keterangan'] ?? '' }}</td>
                    </tr>
                @endforeach
            </tbody>
        </table>
    @endif

    <h2>Pembiasaan, Sikap &amp; Kehadiran</h2>
    <table>
        <tbody>
            <tr>
                <th style="width:22%">Nilai Pembiasaan</th>
                <td>{{ $rapor['pembiasaan'] ?? '-' }}</td>
            </tr>
            <tr>
                <th>Sikap</th>
                <td>Akhlaq: {{ $rapor['sikap']['akhlaq'] ?? '-' }} — Kepribadian: {{ $rapor['sikap']['kepribadian'] ?? '-' }}</td>
            </tr>
            <tr>
                <th>Kehadiran</th>
                <td>
                    Sakit: {{ $rapor['kehadiran']['sakit'] ?? 0 }} &nbsp;·&nbsp;
                    Izin: {{ $rapor['kehadiran']['izin'] ?? 0 }} &nbsp;·&nbsp;
                    Alpa: {{ $rapor['kehadiran']['alpa'] ?? 0 }}
                </td>
            </tr>
            <tr>
                <th>Peringkat</th>
                <td>{{ $rapor['peringkat'] ?? '-' }}@if ($rapor['peringkat']) dari {{ $rapor['kelas']['nama'] ?? 'kelas' }}@endif</td>
            </tr>
        </tbody>
    </table>

    @if (! empty($rapor['semester']['tempat_tanggal_rapot']))
        <div class="info" style="margin-top:8px">
            <span><span class="label">Tempat, tanggal rapot:</span> {{ $rapor['semester']['tempat_tanggal_rapot'] }}</span>
        </div>
    @endif

    <div class="footer ttd">
        <div>Kepala Sekolah</div>
        <div class="nama">{{ $rapor['sekolah']['kepala_sekolah'] ?? '' }}</div>
        <div class="muted">NIP. {{ $rapor['sekolah']['nip_kepala_sekolah'] ?? '-' }}</div>
    </div>
</body>
</html>