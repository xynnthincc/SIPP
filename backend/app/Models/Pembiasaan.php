<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Pembiasaan extends Model
{
    protected $table = 'pembiasaans';

    protected $fillable = ['siswa_id', 'semester_id', 'nilai'];

    public function siswa()
    {
        return $this->belongsTo(Siswa::class);
    }

    public function semester()
    {
        return $this->belongsTo(Semester::class);
    }
}
