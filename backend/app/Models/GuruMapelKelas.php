<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class GuruMapelKelas extends Model
{
    protected $table = 'guru_mapel_kelas';

    protected $fillable = ['guru_id', 'mapel_plus_id', 'kelas_rombel_id', 'semester_id'];

    public function guru()
    {
        return $this->belongsTo(Guru::class);
    }

    public function mapelPlus()
    {
        return $this->belongsTo(MapelPlus::class, 'mapel_plus_id');
    }

    public function kelasRombel()
    {
        return $this->belongsTo(KelasRombel::class);
    }

    public function semester()
    {
        return $this->belongsTo(Semester::class);
    }

    public function jadwals()
    {
        return $this->hasMany(Jadwal::class);
    }
}
