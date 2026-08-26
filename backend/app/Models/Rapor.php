<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Rapor extends Model
{
    public const STATUS_DRAFT = 'Draft';
    public const STATUS_DIAJUKAN = 'Diajukan';
    public const STATUS_DIVALIDASI = 'Divalidasi';
    public const STATUS_DITOLAK = 'Ditolak';
    public const STATUS_DITERBITKAN = 'Diterbitkan';

    protected $fillable = [
        'siswa_id', 'semester_id', 'status',
        'catatan_wali_kelas', 'catatan_kepala_sekolah',
        'disusun_oleh', 'divalidasi_oleh',
        'diajukan_at', 'divalidasi_at', 'file_pdf',
    ];
    protected $casts = ['diajukan_at' => 'datetime', 'divalidasi_at' => 'datetime'];

    public function siswa()
    {
        return $this->belongsTo(Siswa::class);
    }

    public function semester()
    {
        return $this->belongsTo(Semester::class);
    }

    public function disusunOleh()
    {
        return $this->belongsTo(User::class, 'disusun_oleh');
    }

    public function divalidasiOleh()
    {
        return $this->belongsTo(User::class, 'divalidasi_oleh');
    }
}
