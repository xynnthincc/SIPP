<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MapelPlus extends Model
{
    protected $table = 'mapel_plus';
    protected $fillable = ['kode', 'nama', 'deskripsi', 'punya_progres_hafalan'];
    protected $casts = ['punya_progres_hafalan' => 'boolean'];

    public function jenisAssessments()
    {
        return $this->hasMany(JenisAssessment::class);
    }
}
