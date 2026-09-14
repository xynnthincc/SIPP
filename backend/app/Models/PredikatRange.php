<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PredikatRange extends Model
{
    protected $fillable = ['nama', 'nilai_min', 'nilai_max'];

    /** Cari predikat untuk sebuah nilai angka berdasarkan rentang yang dikonfigurasi admin */
    public static function untukNilai(float $nilai): ?self
    {
        return static::query()
            ->where('nilai_min', '<=', $nilai)
            ->where('nilai_max', '>=', $nilai)
            ->orderByDesc('nilai_min')
            ->first();
    }
}
