<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ProgresHafalan extends Model
{
    protected $fillable = ['siswa_id', 'mapel_plus_id', 'tanggal_setoran', 'materi', 'status', 'catatan', 'dicatat_oleh'];
    protected $casts = ['tanggal_setoran' => 'date'];

    public function siswa()
    {
        return $this->belongsTo(Siswa::class);
    }

    public function mapelPlus()
    {
        return $this->belongsTo(MapelPlus::class, 'mapel_plus_id');
    }

    public function dicatatOleh()
    {
        return $this->belongsTo(User::class, 'dicatat_oleh');
    }
}
