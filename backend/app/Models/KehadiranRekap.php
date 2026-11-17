<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class KehadiranRekap extends Model
{
    protected $table = 'kehadiran_rekaps';

    protected $fillable = ['siswa_id', 'semester_id', 'sakit', 'izin', 'alpa'];

    protected $casts = ['sakit' => 'int', 'izin' => 'int', 'alpa' => 'int'];

    public function siswa()
    {
        return $this->belongsTo(Siswa::class);
    }

    public function semester()
    {
        return $this->belongsTo(Semester::class);
    }
}
