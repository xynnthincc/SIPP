<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SiswaKelas extends Model
{
    protected $fillable = ['siswa_id', 'kelas_rombel_id'];

    public function siswa()
    {
        return $this->belongsTo(Siswa::class);
    }

    public function kelasRombel()
    {
        return $this->belongsTo(KelasRombel::class);
    }
}
