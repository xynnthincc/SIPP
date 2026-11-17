<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LogEditNilai extends Model
{
    protected $table = 'log_edit_nilais';

    public const CREATED_AT = null;

    public const UPDATED_AT = 'updated_at';

    protected $fillable = ['siswa_id', 'semester_id', 'updated_by'];

    public function siswa()
    {
        return $this->belongsTo(Siswa::class);
    }

    public function semester()
    {
        return $this->belongsTo(Semester::class);
    }

    public function updater()
    {
        return $this->belongsTo(User::class, 'updated_by');
    }
}
