<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Concerns\ScopesSiswaAccess;
use App\Http\Controllers\Controller;
use App\Models\GuruMapelKelas;
use App\Models\KehadiranRekap;
use App\Models\LogEditNilai;
use App\Models\MapelPlus;
use App\Models\NilaiMapel;
use App\Models\NilaiPraktik;
use App\Models\Pembiasaan;
use App\Models\PraktikItem;
use App\Models\PredikatRange;
use App\Models\Semester;
use App\Models\Sikap;
use App\Models\Siswa;
use App\Models\User;
use App\Support\NilaiDiniyah;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;

class NilaiDiniyahController extends Controller
{
    use ScopesSiswaAccess;

    /**
     * Data untuk form input nilai diniyah satu siswa per semester:
     * nilai per mapel (langsung + agregasi assessment), praktik & hafalan,
     * pembiasaan pagi, sikap, rekap kehadiran, dan jejak edit terakhir.
     */
    public function rekap(Request $request)
    {
        $data = $request->validate([
            'siswa_id' => ['required', 'exists:siswas,id'],
            'semester_id' => ['required', 'exists:semesters,id'],
        ]);

        $this->pastikanBolehLihatSiswa($request, (int) $data['siswa_id']);

        $user = $request->user();
        $siswa = Siswa::with('kelasRombel')->findOrFail($data['siswa_id']);
        $semester = Semester::findOrFail($data['semester_id']);

        $mapelList = $this->mapelRekap($siswa, $semester, $user);
        $praktikList = $this->praktikRekap($siswa, $semester, $user);
        $lengkap = $this->userBolehLengkap($user, $siswa);

        return response()->json([
            'siswa' => [
                'id' => $siswa->id,
                'nama' => $siswa->nama,
                'nis' => $siswa->nis,
                'kelas' => $siswa->kelasRombel?->nama,
            ],
            'semester' => [
                'id' => $semester->id,
                'nama' => $semester->nama,
                'tahun' => $semester->tahunAjaran->nama,
                'penilaian_dibuka' => $semester->penilaian_dibuka,
            ],
            'mapel' => $mapelList,
            'praktik' => $praktikList,
            'pembiasaan' => Pembiasaan::where('siswa_id', $siswa->id)->where('semester_id', $semester->id)->first(),
            'sikap' => Sikap::where('siswa_id', $siswa->id)->where('semester_id', $semester->id)->first(),
            'kehadiran' => KehadiranRekap::where('siswa_id', $siswa->id)->where('semester_id', $semester->id)->first(),
            'log_edit' => LogEditNilai::with('updater')->where('siswa_id', $siswa->id)->where('semester_id', $semester->id)->first(),
            'bisa_edit_pembiasaan' => $lengkap,
        ]);
    }

    /**
     * Simpan nilai diniyah satu siswa: mapel (mix dengan agregasi), praktik,
     * pembiasaan, sikap & kehadiran dalam satu klik. Sekaligus membubuhkan
     * jejak 'terakhir diubah' (log_edit_nilais).
     */
    public function simpan(Request $request)
    {
        $data = $request->validate([
            'siswa_id' => ['required', 'exists:siswas,id'],
            'semester_id' => ['required', 'exists:semesters,id'],
            'nilai_mapel' => ['sometimes', 'array'],
            'nilai_mapel.*.mapel_plus_id' => ['required', 'exists:mapel_plus,id'],
            'nilai_mapel.*.kkm' => ['required', 'integer', 'between:1,100'],
            'nilai_mapel.*.nilai' => ['nullable', 'integer', 'between:0,100'],
            'nilai_praktik' => ['sometimes', 'array'],
            'nilai_praktik.*.praktik_item_id' => ['required', 'exists:praktik_items,id'],
            'nilai_praktik.*.nilai' => ['nullable', 'in:A,B,C,D'],
            'nilai_praktik.*.keterangan' => ['nullable', 'string', 'max:255'],
            'pembiasaan' => ['sometimes', 'array'],
            'pembiasaan.nilai' => ['nullable', 'integer', 'between:0,100'],
            'sikap' => ['sometimes', 'array'],
            'sikap.akhlaq' => ['nullable', 'in:A,B,C,D'],
            'sikap.kepribadian' => ['nullable', 'in:A,B,C,D'],
            'kehadiran' => ['sometimes', 'array'],
            'kehadiran.sakit' => ['sometimes', 'integer', 'min:0'],
            'kehadiran.izin' => ['sometimes', 'integer', 'min:0'],
            'kehadiran.alpa' => ['sometimes', 'integer', 'min:0'],
        ]);

        $user = $request->user();
        $siswa = Siswa::with('kelasRombel')->findOrFail($data['siswa_id']);
        $semester = Semester::findOrFail($data['semester_id']);

        abort_unless($semester->penilaian_dibuka, 422, 'Periode penilaian semester ini sudah ditutup.');

        $lengkap = $this->userBolehLengkap($user, $siswa);
        $mapelBoleh = $this->mapelBolehD($request, $siswa, $semester);
        $praktikBoleh = $this->praktikBolehD($user, $siswa, $semester);

        if (isset($data['nilai_mapel'])) {
            foreach ($data['nilai_mapel'] as $item) {
                abort_unless($mapelBoleh->contains($item['mapel_plus_id']), 403, 'Anda tidak mengampu mata pelajaran ini di kelas siswa tersebut.');
                NilaiMapel::updateOrCreate(
                    [
                        'siswa_id' => $siswa->id,
                        'mapel_plus_id' => $item['mapel_plus_id'],
                        'semester_id' => $semester->id,
                    ],
                    ['kkm' => $item['kkm'], 'nilai' => $item['nilai'] ?? null]
                );
            }
        }

        if (isset($data['nilai_praktik'])) {
            foreach ($data['nilai_praktik'] as $item) {
                abort_unless($praktikBoleh->contains($item['praktik_item_id']), 403, 'Anda tidak mengampu item praktik/hafalan ini.');
                NilaiPraktik::updateOrCreate(
                    [
                        'siswa_id' => $siswa->id,
                        'praktik_item_id' => $item['praktik_item_id'],
                        'semester_id' => $semester->id,
                    ],
                    [
                        'nilai' => $item['nilai'] ?? null,
                        'keterangan' => $item['keterangan'] ?? null,
                    ]
                );
            }
        }

        if (isset($data['pembiasaan']) || isset($data['sikap']) || isset($data['kehadiran'])) {
            abort_unless($lengkap, 403, 'Hanya wali kelas atau admin yang dapat mengisi pembiasaan, sikap, dan kehadiran.');
        }

        if (isset($data['pembiasaan'])) {
            Pembiasaan::updateOrCreate(
                ['siswa_id' => $siswa->id, 'semester_id' => $semester->id],
                ['nilai' => $data['pembiasaan']['nilai'] ?? null]
            );
        }

        if (isset($data['sikap'])) {
            Sikap::updateOrCreate(
                ['siswa_id' => $siswa->id, 'semester_id' => $semester->id],
                [
                    'akhlaq' => $data['sikap']['akhlaq'] ?? null,
                    'kepribadian' => $data['sikap']['kepribadian'] ?? null,
                ]
            );
        }

        if (isset($data['kehadiran'])) {
            KehadiranRekap::updateOrCreate(
                ['siswa_id' => $siswa->id, 'semester_id' => $semester->id],
                [
                    'sakit' => $data['kehadiran']['sakit'] ?? 0,
                    'izin' => $data['kehadiran']['izin'] ?? 0,
                    'alpa' => $data['kehadiran']['alpa'] ?? 0,
                ]
            );
        }

        LogEditNilai::updateOrCreate(
            ['siswa_id' => $siswa->id, 'semester_id' => $semester->id],
            ['updated_by' => $user->id]
        );

        return response()->json(['message' => 'Nilai diniyah berhasil disimpan.']);
    }

    /* ── Helpers ──────────────────────────────────────────── */

    private function userBolehLengkap(User $user, Siswa $siswa): bool
    {
        if ($user->hasRole('admin')) {
            return true;
        }

        return $user->hasRole('wali_kelas') && $siswa->kelasRombel?->wali_kelas_id === $user->id;
    }

    private function mapelBolehD(Request $request, Siswa $siswa, Semester $semester): Collection
    {
        $user = $request->user();

        if ($this->userBolehLengkap($user, $siswa)) {
            return MapelPlus::pluck('id');
        }

        if ($user->hasRole('guru_pesantren') && $user->guru && $siswa->kelas_rombel_id) {
            return GuruMapelKelas::where('guru_id', $user->guru->id)
                ->where('kelas_rombel_id', $siswa->kelas_rombel_id)
                ->where('semester_id', $semester->id)
                ->pluck('mapel_plus_id');
        }

        return collect();
    }

    private function praktikBolehD(User $user, Siswa $siswa, Semester $semester): Collection
    {
        if ($this->userBolehLengkap($user, $siswa)) {
            return PraktikItem::pluck('id');
        }

        if ($user->hasRole('guru_pesantren') && $user->guru) {
            return $user->guru->praktikItems()->pluck('praktik_items.id');
        }

        return collect();
    }

    private function mapelRekap(Siswa $siswa, Semester $semester, User $user): array
    {
        $mapels = MapelPlus::orderBy('urutan')->orderBy('kode')->get();
        $langsung = NilaiMapel::where('siswa_id', $siswa->id)->where('semester_id', $semester->id)->get()->keyBy('mapel_plus_id');
        $efektif = NilaiDiniyah::nilaiPerMapel($siswa->id, $semester->id);
        $mapelBoleh = $this->mapelBolehD(request(), $siswa, $semester);

        return $mapels->map(function (MapelPlus $mapel) use ($langsung, $efektif, $mapelBoleh) {
            $row = $langsung->get($mapel->id);
            $nilai = $efektif->get($mapel->id);

            return [
                'id' => $mapel->id,
                'kode' => $mapel->kode,
                'nama' => $mapel->nama,
                'nama_ar' => $mapel->nama_ar,
                'kelompok' => $mapel->kelompok,
                'kkm_default' => $mapel->kkm_default,
                'urutan' => $mapel->urutan,
                'nilai_mapel' => $row ? ['kkm' => $row->kkm, 'nilai' => $row->nilai] : null,
                'nilai_akhir' => $nilai,
                'predikat' => $nilai !== null ? PredikatRange::untukNilai($nilai)?->nama : null,
                'bisa_edit' => $mapelBoleh->contains($mapel->id),
            ];
        })->all();
    }

    private function praktikRekap(Siswa $siswa, Semester $semester, User $user): array
    {
        $items = PraktikItem::orderBy('urutan')->get();
        $terisi = NilaiPraktik::where('siswa_id', $siswa->id)->where('semester_id', $semester->id)->get()->keyBy('praktik_item_id');
        $praktikBoleh = $this->praktikBolehD($user, $siswa, $semester);

        return $items->map(function (PraktikItem $item) use ($terisi, $praktikBoleh) {
            $row = $terisi->get($item->id);

            return [
                'id' => $item->id,
                'kode' => $item->kode,
                'nama_id' => $item->nama_id,
                'nama_ar' => $item->nama_ar,
                'urutan' => $item->urutan,
                'nilai' => $row?->nilai,
                'keterangan' => $row?->keterangan,
                'bisa_edit' => $praktikBoleh->contains($item->id),
            ];
        })->all();
    }
}
