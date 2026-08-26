<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TahunAjaran extends Model
{
    protected $fillable = ['nama', 'is_aktif'];
    protected $casts = ['is_aktif' => 'boolean'];

    public function semesters()
    {
        return $this->hasMany(Semester::class);
    }

    public function kelasRombels()
    {
        return $this->hasMany(KelasRombel::class);
    }
}
