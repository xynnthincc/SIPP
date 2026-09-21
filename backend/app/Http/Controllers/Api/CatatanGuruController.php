<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Concerns\ScopesSiswaAccess;
use App\Http\Controllers\Controller;
use App\Models\CatatanGuru;
use App\Models\Siswa;
use App\Services\PushService;
use Illuminate\Http\Request;

class CatatanGuruController extends Controller
{
    use ScopesSiswaAccess;

    public function index(Request $request)
    {
        $user = $request->user();
        $siswaId = $request->siswa_id;

        if ($user->hasRole('siswa')) {
            $siswaId = $user->siswa?->id;
        } elseif ($siswaId) {
            $this->pastikanBolehLihatSiswa($request, (int) $siswaId);
        } elseif ($user->hasRole('orang_tua')) {
            abort(422, 'Parameter siswa_id wajib diisi untuk akun orang tua.');
        }

        return CatatanGuru::with('guru')
            ->when($siswaId, fn ($q, $id) => $q->where('siswa_id', $id))
            ->orderByDesc('tanggal')
            ->get();
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'siswa_id' => ['required', 'exists:siswas,id'],
            'tanggal' => ['required', 'date'],
            'catatan' => ['required', 'string'],
            'lampiran' => ['nullable', 'file', 'mimes:jpg,jpeg,png,pdf,mp3,m4a,mp4,webm', 'max:15360'],
        ]);

        $guru = $request->user()->guru;
        abort_unless($guru, 403, 'Hanya guru pesantren yang dapat menambahkan catatan.');

        $data['guru_id'] = $guru->id;

        if ($request->hasFile('lampiran')) {
            $data['lampiran'] = $request->file('lampiran')->store('catatan', 'public');
        }

        $catatan = CatatanGuru::create($data);

        $this->notifOrtu($catatan);

        return $catatan->load('guru');
    }

    private function notifOrtu(CatatanGuru $catatan): void
    {
        $siswa = Siswa::find($catatan->siswa_id);
        $ortu = $siswa?->wali()->where('role', 'orang_tua')->get();

        if ($ortu === null || $ortu->isEmpty()) {
            return;
        }

        app(PushService::class)->notifyMany(
            $ortu,
            PushService::TYPE_CATATAN_GURU,
            'Catatan Guru',
            "Komentar guru untuk {$siswa->nama}: ".mb_substr(strip_tags($catatan->catatan), 0, 140),
            '/ortu/progres-anak',
            ['siswa_id' => $siswa->id, 'catatan_id' => $catatan->id]
        );
    }
}
