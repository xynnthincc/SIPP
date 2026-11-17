<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MapelPlus extends Model
{
    protected $table = 'mapel_plus';

    protected $fillable = [
        'kode', 'nama', 'nama_ar', 'kelompok', 'kkm_default', 'urutan',
        'deskripsi', 'punya_progres_hafalan',
    ];

    protected $casts = ['punya_progres_hafalan' => 'boolean'];

    public function jenisAssessments()
    {
        return $this->hasMany(JenisAssessment::class);
    }

    public function progresHafalans()
    {
        return $this->hasMany(ProgresHafalan::class);
    }

    public function guruMapelKelas()
    {
        return $this->hasMany(GuruMapelKelas::class);
    }

    public function nilaiMapels()
    {
        return $this->hasMany(NilaiMapel::class);
    }
}
