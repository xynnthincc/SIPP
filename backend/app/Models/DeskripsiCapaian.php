<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DeskripsiCapaian extends Model
{
    protected $fillable = ['siswa_id', 'mapel_plus_id', 'semester_id', 'deskripsi'];

    public function siswa()
    {
        return $this->belongsTo(Siswa::class);
    }

    public function mapelPlus()
    {
        return $this->belongsTo(MapelPlus::class);
    }

    public function semester()
    {
        return $this->belongsTo(Semester::class);
    }
}
