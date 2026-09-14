<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Siswa extends Model
{
    protected $fillable = [
        'user_id', 'nis', 'nama', 'kelas_rombel_id',
        'jenis_kelamin', 'tempat_lahir', 'tanggal_lahir', 'is_aktif',
    ];

    protected $casts = ['tanggal_lahir' => 'date', 'is_aktif' => 'boolean'];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function kelasRombel()
    {
        return $this->belongsTo(KelasRombel::class);
    }

    public function wali()
    {
        return $this->belongsToMany(User::class, 'siswa_wali', 'siswa_id', 'user_id')
            ->withPivot('hubungan')->withTimestamps();
    }

    public function presensis()
    {
        return $this->hasMany(Presensi::class);
    }

    public function nilais()
    {
        return $this->hasMany(Nilai::class);
    }

    public function progresHafalans()
    {
        return $this->hasMany(ProgresHafalan::class);
    }

    public function catatanGurus()
    {
        return $this->hasMany(CatatanGuru::class);
    }

    public function deskripsiCapaians()
    {
        return $this->hasMany(DeskripsiCapaian::class);
    }

    public function rapors()
    {
        return $this->hasMany(Rapor::class);
    }
}
