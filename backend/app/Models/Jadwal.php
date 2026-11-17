<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Jadwal extends Model
{
    protected $fillable = ['guru_mapel_kelas_id', 'hari', 'jam_mulai', 'jam_selesai', 'ruangan'];

    public function guruMapelKelas()
    {
        return $this->belongsTo(GuruMapelKelas::class);
    }

    public function presensis()
    {
        return $this->hasMany(Presensi::class);
    }
}
