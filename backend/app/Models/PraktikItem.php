<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PraktikItem extends Model
{
    protected $table = 'praktik_items';

    protected $fillable = ['kode', 'nama_id', 'nama_ar', 'urutan'];

    public function nilaiPraktiks()
    {
        return $this->hasMany(NilaiPraktik::class);
    }

    public function gurus()
    {
        return $this->belongsToMany(Guru::class, 'guru_praktik', 'praktik_item_id', 'guru_id')
            ->withTimestamps();
    }
}
