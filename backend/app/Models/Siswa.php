<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Siswa extends Model
{
    protected $fillable = [
        'user_id', 'nis', 'nama', 'kelas_rombel_id',
        'jenis_kelamin', 'tempat_lahir', 'tanggal_lahir', 'is_aktif',
        'alamat', 'sekolah_asal', 'nama_ayah', 'nama_ibu', 'no_wa_ayah',
        'profesi_ayah', 'profesi_ibu', 'agama', 'status_anak', 'anak_ke',
        'no_telp', 'foto', 'diterima_kelas', 'diterima_tanggal', 'no_telp_ibu',
        'alamat_ortu', 'nama_wali', 'pekerjaan_wali', 'alamat_wali', 'no_telp_wali',
    ];

    protected $casts = [
        'tanggal_lahir' => 'date',
        'diterima_tanggal' => 'date',
        'is_aktif' => 'boolean',
    ];

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

    public function nilaiMapels()
    {
        return $this->hasMany(NilaiMapel::class);
    }

    public function nilaiPraktiks()
    {
        return $this->hasMany(NilaiPraktik::class);
    }

    public function pembiasaan()
    {
        return $this->hasOne(Pembiasaan::class);
    }

    public function sikap()
    {
        return $this->hasOne(Sikap::class);
    }

    public function kehadiranRekap()
    {
        return $this->hasOne(KehadiranRekap::class);
    }

    public function logEditNilai()
    {
        return $this->hasOne(LogEditNilai::class);
    }
}
