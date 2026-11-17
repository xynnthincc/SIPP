<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Nilai extends Model
{
    protected $fillable = ['siswa_id', 'jenis_assessment_id', 'semester_id', 'nilai', 'catatan', 'dicatat_oleh'];

    public function siswa()
    {
        return $this->belongsTo(Siswa::class);
    }

    public function jenisAssessment()
    {
        return $this->belongsTo(JenisAssessment::class);
    }

    public function semester()
    {
        return $this->belongsTo(Semester::class);
    }

    public function dicatatOleh()
    {
        return $this->belongsTo(User::class, 'dicatat_oleh');
    }
}
