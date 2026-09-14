<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class JenisAssessment extends Model
{
    protected $fillable = ['mapel_plus_id', 'nama', 'kategori', 'bobot'];

    public function mapelPlus()
    {
        return $this->belongsTo(MapelPlus::class, 'mapel_plus_id');
    }

    public function nilais()
    {
        return $this->hasMany(Nilai::class);
    }
}
