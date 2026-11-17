<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class NilaiPraktik extends Model
{
    protected $table = 'nilai_praktiks';

    protected $fillable = ['siswa_id', 'praktik_item_id', 'semester_id', 'nilai', 'keterangan'];

    public function siswa()
    {
        return $this->belongsTo(Siswa::class);
    }

    public function praktikItem()
    {
        return $this->belongsTo(PraktikItem::class);
    }

    public function semester()
    {
        return $this->belongsTo(Semester::class);
    }
}
