<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Semester extends Model
{
    protected $fillable = ['tahun_ajaran_id', 'nama', 'jenis', 'parent_id', 'is_aktif', 'penilaian_dibuka', 'tempat_tanggal_rapot'];

    protected $casts = ['is_aktif' => 'boolean', 'penilaian_dibuka' => 'boolean'];

    public function tahunAjaran()
    {
        return $this->belongsTo(TahunAjaran::class);
    }

    public function parent()
    {
        return $this->belongsTo(Semester::class, 'parent_id');
    }

    public function children()
    {
        return $this->hasMany(Semester::class, 'parent_id');
    }

    /**
     * Semester operasional: Sementara selalu ikut induk Akhir-nya (siswa,
     * mapel, penugasan, jadwal, presensi dipakai bersama). Hanya penyimpanan
     * NILAI yang memakai wadah semester itu sendiri.
     */
    public function induk(): self
    {
        if ($this->jenis === 'Sementara' && $this->parent_id) {
            return $this->parent ?? $this;
        }

        return $this;
    }
}
