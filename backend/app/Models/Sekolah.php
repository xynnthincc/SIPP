<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Sekolah extends Model
{
    protected $table = 'sekolahs';

    protected $fillable = [
        'nama_sekolah', 'npsn', 'alamat', 'kelurahan', 'kecamatan',
        'kota_kabupaten', 'provinsi', 'kode_pos', 'telepon',
        'kepala_sekolah', 'nip_kepala_sekolah',
    ];

    /**
     * Ambil profil sekolah (single row); otomatis dibuat bila belum ada.
     */
    public static function profil(): self
    {
        return static::query()->firstOrCreate([], ['nama_sekolah' => 'NAMA SEKOLAH ANDA']);
    }
}
