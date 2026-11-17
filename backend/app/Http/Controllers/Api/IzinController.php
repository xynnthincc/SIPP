<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Izin;
use App\Services\PushService;
use Illuminate\Http\Request;

class IzinController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        $query = Izin::query()
            ->with('siswa:id,nis,nama', 'pengaju:id,name')
            ->latest();

        if ($user->hasRole('orang_tua')) {
            $anakIds = $user->anakWali()->pluck('siswas.id');
            $query->whereIn('siswa_id', $anakIds);
        } elseif ($user->hasRole('siswa')) {
            $query->where('siswa_id', $user->siswa?->id);
        } elseif ($user->hasRole('wali_kelas')) {
            $query->whereHas('siswa', fn ($q) => $q->whereHas('kelasRombel', fn ($k) => $k->where('wali_kelas_id', $user->id)));
        } elseif (! $user->hasRole('admin', 'kepala_sekolah')) {
            abort(403);
        }

        if ($request->has('status')) {
            $query->where('status', $request->validate(['status' => ['string', 'in:pending,disetujui,ditolak']])['status']);
        }

        if ($request->boolean('all')) {
            return $query->get();
        }

        return $query->paginate((int) $request->integer('per_page', 20));
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'siswa_id' => ['required', 'exists:siswas,id'],
            'jenis' => ['required', 'string', 'max:50'],
            'tanggal_mulai' => ['required', 'date'],
            'tanggal_selesai' => ['required', 'date', 'after_or_equal:tanggal_mulai'],
            'alasan' => ['required', 'string'],
            'lampiran' => ['nullable', 'file', 'mimes:jpg,jpeg,png,pdf', 'max:5120'],
        ]);

        $user = $request->user();

        $boleh = $user->hasRole('admin')
            || ($user->hasRole('orang_tua') && $user->anakWali()->where('siswas.id', $data['siswa_id'])->exists());
        abort_unless($boleh, 403, 'Anda hanya dapat mengajukan izin untuk anak yang terdaftar sebagai wali Anda.');

        $data['diajukan_oleh'] = $user->id;

        if ($request->hasFile('lampiran')) {
            $data['lampiran'] = $request->file('lampiran')->store('izin', 'public');
        }

        $izin = Izin::create($data);

        $this->notifWaliKelas($izin);

        return response()->json($izin->load('siswa:id,nis,nama', 'pengaju:id,name'), 201);
    }

    public function updateStatus(Request $request, Izin $izin)
    {
        $data = $request->validate([
            'status' => ['required', 'in:disetujui,ditolak'],
            'catatan' => ['nullable', 'string', 'max:1000'],
        ]);

        $user = $request->user();
        $siswa = $izin->siswa;
        abort_unless(
            $user->hasRole('admin') || ($user->hasRole('wali_kelas') && $siswa->kelasRombel?->wali_kelas_id === $user->id),
            403,
            'Anda bukan wali kelas siswa ini.'
        );

        $izin->update([
            'status' => $data['status'],
            'catatan' => $data['catatan'] ?? null,
            'disetujui_oleh' => $user->id,
            'disetujui_waktu' => now(),
        ]);

        if ($izin->pengaju?->hasRole('orang_tua')) {
            app(PushService::class)->notify(
                $izin->pengaju,
                PushService::TYPE_IZIN_STATUS,
                'Izin '.($data['status'] === 'disetujui' ? 'Disetujui' : 'Ditolak'),
                "{$siswa->nama}: izin {$izin->jenis} ({$izin->tanggal_mulai->translatedFormat('d M Y')}) berstatus ".$data['status'],
                null,
                ['izin_id' => $izin->id, 'status' => $data['status']]
            );
        }

        return $izin->load('siswa:id,nis,nama', 'pengaju:id,name', 'penyetuju:id,name');
    }

    private function notifWaliKelas(Izin $izin): void
    {
        $wali = $izin->siswa->kelasRombel?->waliKelas;
        if (! $wali) {
            return;
        }

        $siswa = $izin->siswa;
        app(PushService::class)->notify(
            $wali,
            PushService::TYPE_IZIN_BARU,
            'Izin Baru',
            "{$siswa->nama} mengajukan izin {$izin->jenis} ({$izin->tanggal_mulai->translatedFormat('d M Y')} s/d {$izin->tanggal_selesai->translatedFormat('d M Y')})",
            '/wali-kelas/izin',
            ['izin_id' => $izin->id, 'siswa_id' => $siswa->id]
        );
    }
}
