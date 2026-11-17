<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CatatanGuru extends Model
{
    protected $table = 'catatan_gurus';

    protected $fillable = ['siswa_id', 'guru_id', 'tanggal', 'catatan', 'lampiran'];

    protected $casts = ['tanggal' => 'date'];

    public function siswa()
    {
        return $this->belongsTo(Siswa::class);
    }

    public function guru()
    {
        return $this->belongsTo(Guru::class);
    }
}
