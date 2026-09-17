<?php

namespace App\Support;

/**
 * Helper bilangan & teks Arab untuk cetak rapor diniyah bilingual.
 * Ditransliterasi dari aplikasi e-rapor-plus (fungsi_nilai.php).
 */
class ArabBilangan
{
    /** Ubah angka barat (0-9) menjadi angka Arab (٠-٩), khusus tampilan cetak. */
    public static function angkaArab($n): ?string
    {
        if ($n === null || $n === '') {
            return null;
        }

        $barat = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
        $arab = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];

        return str_replace($barat, $arab, (string) $n);
    }

    /** Ubah huruf nilai sikap (A/B/C/D) menjadi huruf Arab (أ/ب/ج/د). */
    public static function hurufArab($x): ?string
    {
        if ($x === null || trim((string) $x) === '') {
            return null;
        }

        $map = ['A' => 'أ', 'B' => 'ب', 'C' => 'ج', 'D' => 'د'];
        $x = strtoupper(trim((string) $x));

        return $map[$x] ?? $x;
    }

    /** Terbilang 0-100 dalam Bahasa Arab (lookup from sheet RUMUS ANGKA sekolah). */
    public static function terbilangArab($n): string
    {
        $tabel = [
            0 => 'صفر',
            1 => 'واحد',
            2 => 'اثنين',
            3 => 'ثلاثة',
            4 => 'أربعة',
            5 => 'خمسة',
            6 => 'ستة',
            7 => 'سبعة',
            8 => 'ثمانية',
            9 => 'تسعة',
            10 => 'عشرة',
            11 => 'إحدى عشر',
            12 => 'اثنا عشر',
            13 => 'ثلاثة عشر',
            14 => 'أربعة عشر',
            15 => 'خمسة عشر',
            16 => 'ستة عشر',
            17 => 'سبعة عشر',
            18 => 'ثمانية عشر',
            19 => 'تسعة عشر',
            20 => 'عشرين',
            21 => 'إحدى وعشرون',
            22 => 'إثنان وعشرون',
            23 => 'ثلاثة وعشرين',
            24 => 'أربعة وعشرون',
            25 => 'خمسة وعشرون',
            26 => 'ستة وعشرون',
            27 => 'سبعة وعشرون',
            28 => 'ثمانية وعشرون',
            29 => 'تسعة وعشرون',
            30 => 'ثلاثين',
            31 => 'واحد وثلاثون',
            32 => 'اثنان وثلاثون',
            33 => 'ثلاثة وثلاثون',
            34 => 'أربعة وثلاثون',
            35 => 'خمسة وثلاثون',
            36 => 'ستة وثلاثون',
            37 => 'سبعة وثلاثون',
            38 => 'ثمانية وثلاثون',
            39 => 'تسعة وثلاثون',
            40 => 'أربعون',
            41 => 'واحد وأربعون',
            42 => 'اثنان وأربعون',
            43 => 'ثلاثة وأربعون',
            44 => 'أربعة وأربعون',
            45 => 'خمسة وأربعون',
            46 => 'ستة وأربعون',
            47 => 'سبعة وأربعون',
            48 => 'ثمانية وأربعون',
            49 => 'تسعة وأربعون',
            50 => 'خمسون',
            51 => 'واحد وخمسون',
            52 => 'اثنان وخمسون',
            53 => 'ثلاثة وخمسون',
            54 => 'أربعة وخمسون',
            55 => 'خمسة وخمسون',
            56 => 'ستة وخمسون',
            57 => 'سبعة وخمسون',
            58 => 'ثمانية وخمسون',
            59 => 'تسعة وخمسون',
            60 => 'ستين',
            61 => 'واحد وستون',
            62 => 'اثنان وستون',
            63 => 'ثلاثة وستون',
            64 => 'أربعة وستون',
            65 => 'خمسة وستون',
            66 => 'ستة وستون',
            67 => 'سبعة وستون',
            68 => 'ثمانية وستون',
            69 => 'تسعة وستون',
            70 => 'سبعون',
            71 => 'واحد وسبعون',
            72 => 'اثنان وسبعون',
            73 => 'ثلاثة وسبعون',
            74 => 'أربعة وسبعون',
            75 => 'خمسة وسبعون',
            76 => 'ستة وسبعون',
            77 => 'سبعة وسبعون',
            78 => 'ثمانية وسبعون',
            79 => 'تسعة وسبعون',
            80 => 'ثمانون',
            81 => 'واحد وثمانون',
            82 => 'اثنان وثمانون',
            83 => 'ثلاثة وثمانون',
            84 => 'أربعة وثمانون',
            85 => 'خمسة وثمانون',
            86 => 'ستة وثمانون',
            87 => 'سبعة وثمانون',
            88 => 'ثمانية وثمانون',
            89 => 'تسعة وثمانون',
            90 => 'تسعون',
            91 => 'واحد وتسعون',
            92 => 'اثنان وتسعون',
            93 => 'ثلاثة وتسعون',
            94 => 'أربعة وتسعون',
            95 => 'خمسة وتسعون',
            96 => 'ستة وتسعون',
            97 => 'سبعة وتسعون',
            98 => 'ثمانية وتسعون',
            99 => 'تسعة وتسعون',
            100 => 'مئة',
        ];

        $n = (int) round((float) $n);
        $n = max(0, min(100, $n));

        return $tabel[$n] ?? '-';
    }

    /** Kriteria nilai (Ket Nilai) berdasarkan rentang skor. */
    public static function ketNilai($n): string
    {
        $n = (int) round((float) $n);

        if ($n >= 90) {
            return 'ممتاز';
        }
        if ($n >= 80) {
            return 'جيّد جدّا';
        }
        if ($n >= 70) {
            return 'جيد';
        }
        if ($n >= 60) {
            return 'متوسط';
        }
        if ($n >= 50) {
            return 'رديء';
        }

        return '-';
    }

    /** Predikat & deskripsi kemajuan belajar berdasarkan peringkat (rank di kelas). */
    public static function predikatByRank(int $peringkat): array
    {
        if ($peringkat >= 1 && $peringkat <= 15) {
            return [
                'predikat_ar' => 'جيّد جدّا',
                'predikat_id' => 'BAIK',
                'deskripsi' => 'MEMILIKI PENGUASAAN MATERI, PRAKTEK & HAFALAN YANG BAIK (BERHASIL MENCAPAI TARGET PEMBELAJARAN YANG DIBERIKAN)',
            ];
        }

        return [
            'predikat_ar' => 'جيد',
            'predikat_id' => 'CUKUP',
            'deskripsi' => 'MEMILIKI PENGUASAAN MATERI, PRAKTEK & HAFALAN DENGAN CUKUP BAIK (BERHASIL MENCAPAI TARGET PEMBELAJARAN YANG DIBERIKAN)',
        ];
    }
}
