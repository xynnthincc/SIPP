<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Semester extends Model
{
    protected $fillable = ['tahun_ajaran_id', 'nama', 'is_aktif', 'penilaian_dibuka', 'tempat_tanggal_rapot'];

    protected $casts = ['is_aktif' => 'boolean', 'penilaian_dibuka' => 'boolean'];

    public function tahunAjaran()
    {
        return $this->belongsTo(TahunAjaran::class);
    }
}
