<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Sikap extends Model
{
    protected $table = 'sikaps';

    protected $fillable = ['siswa_id', 'semester_id', 'akhlaq', 'kepribadian'];

    public function siswa()
    {
        return $this->belongsTo(Siswa::class);
    }

    public function semester()
    {
        return $this->belongsTo(Semester::class);
    }
}
