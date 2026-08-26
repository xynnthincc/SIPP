<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable, HasApiTokens;

    public const ROLE_ADMIN = 'admin';
    public const ROLE_GURU_PESANTREN = 'guru_pesantren';
    public const ROLE_WALI_KELAS = 'wali_kelas';
    public const ROLE_KEPALA_SEKOLAH = 'kepala_sekolah';
    public const ROLE_SISWA = 'siswa';
    public const ROLE_ORANG_TUA = 'orang_tua';

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
        'identifier',
        'is_active',
    ];

    public function hasRole(string ...$roles): bool
    {
        return in_array($this->role, $roles, true);
    }

    public function guru()
    {
        return $this->hasOne(Guru::class);
    }

    public function siswa()
    {
        return $this->hasOne(Siswa::class);
    }

    public function anakWali()
    {
        return $this->belongsToMany(Siswa::class, 'siswa_wali', 'user_id', 'siswa_id')
            ->withPivot('hubungan')->withTimestamps();
    }

    public function kelasDiwalikan()
    {
        return $this->hasMany(KelasRombel::class, 'wali_kelas_id');
    }

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }
}
