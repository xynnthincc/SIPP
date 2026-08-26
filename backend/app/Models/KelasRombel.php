<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class KelasRombel extends Model
{
    protected $fillable = ['nama', 'tingkat', 'wali_kelas_id', 'tahun_ajaran_id'];

    public function waliKelas()
    {
        return $this->belongsTo(User::class, 'wali_kelas_id');
    }

    public function tahunAjaran()
    {
        return $this->belongsTo(TahunAjaran::class);
    }

    public function siswas()
    {
        return $this->hasMany(Siswa::class);
    }
}
