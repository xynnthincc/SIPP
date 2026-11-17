<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Guru extends Model
{
    protected $fillable = ['user_id', 'nip', 'nama', 'no_hp', 'is_aktif'];

    protected $casts = ['is_aktif' => 'boolean'];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function guruMapelKelas()
    {
        return $this->hasMany(GuruMapelKelas::class);
    }

    public function catatanGurus()
    {
        return $this->hasMany(CatatanGuru::class);
    }

    public function praktikItems()
    {
        return $this->belongsToMany(PraktikItem::class, 'guru_praktik', 'guru_id', 'praktik_item_id')
            ->withTimestamps();
    }
}
