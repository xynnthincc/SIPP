<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Concerns\ScopesSiswaAccess;
use App\Http\Controllers\Controller;
use App\Models\KehadiranRekap;
use App\Models\MapelPlus;
use App\Models\NilaiMapel;
use App\Models\NilaiPraktik;
use App\Models\Pembiasaan;
use App\Models\PraktikItem;
use App\Models\Rapor;
use App\Models\Sekolah;
use App\Models\Sikap;
use App\Models\Siswa;
use App\Support\ArabBilangan;
use App\Support\NilaiDiniyah;
use Illuminate\Http\Request;

class RaporController extends Controller
{
    use ScopesSiswaAccess;

    public function index(Request $request)
    {
        $user = $request->user();

        return Rapor::with('siswa.kelasRombel', 'semester')
            ->when($user->hasRole('siswa'), fn ($q) => $q->whereHas('siswa', fn ($qq) => $qq->where('user_id', $user->id)))
            ->when($user->hasRole('orang_tua'), fn ($q) => $q->whereIn('siswa_id', $user->anakWali()->pluck('siswas.id')))
            ->when($user->hasRole('wali_kelas'), function ($q) use ($user) {
                $q->whereHas('siswa.kelasRombel', fn ($qq) => $qq->where('wali_kelas_id', $user->id));
            })
            ->when($request->siswa_id, fn ($q, $id) => $q->where('siswa_id', $id))
            ->when($request->semester_id, fn ($q, $id) => $q->where('semester_id', $id))
            ->when($request->status, fn ($q, $s) => $q->where('status', $s))
            ->get();
    }

    public function show(Rapor $rapor)
    {
        $rapor->load('siswa.kelasRombel', 'siswa.nilais.jenisAssessment.mapelPlus', 'siswa.progresHafalans', 'siswa.presensis', 'semester');

        // Sertakan deskripsi capaian mapel untuk semester rapor ini saja
        $rapor->siswa->setRelation(
            'deskripsiCapaians',
            $rapor->siswa->deskripsiCapaians()
                ->where('semester_id', $rapor->semester_id)
                ->with('mapelPlus')
                ->get()
        );

        return $rapor;
    }

    /** Wali kelas menyusun draft rapor untuk siswa binaannya */
    public function store(Request $request)
    {
        $data = $request->validate([
            'siswa_id' => ['required', 'exists:siswas,id'],
            'semester_id' => ['required', 'exists:semesters,id'],
        ]);

        $siswa = Siswa::findOrFail($data['siswa_id']);
        $this->pastikanWaliKelasSiswa($request, $siswa);

        return Rapor::firstOrCreate($data, [
            'status' => Rapor::STATUS_DRAFT,
            'disusun_oleh' => $request->user()->id,
        ]);
    }

    /** Wali kelas mengajukan rapor ke kepala sekolah untuk divalidasi (rapor Ditolak boleh diajukan ulang setelah diperbaiki) */
    public function ajukan(Request $request, Rapor $rapor)
    {
        $this->pastikanWaliKelasSiswa($request, $rapor->siswa);
        abort_unless(
            in_array($rapor->status, [Rapor::STATUS_DRAFT, Rapor::STATUS_DITOLAK]),
            422,
            'Hanya rapor berstatus Draft atau Ditolak yang dapat diajukan.'
        );

        $data = $request->validate(['catatan_wali_kelas' => ['nullable', 'string']]);

        $rapor->update([
            'status' => Rapor::STATUS_DIAJUKAN,
            'catatan_wali_kelas' => $data['catatan_wali_kelas'] ?? $rapor->catatan_wali_kelas,
            'diajukan_at' => now(),
        ]);

        return $rapor;
    }

    /** Kepala sekolah memvalidasi/menolak rapor sebelum diterbitkan */
    public function validasi(Request $request, Rapor $rapor)
    {
        abort_unless($request->user()->hasRole('kepala_sekolah', 'admin'), 403);
        abort_unless($rapor->status === Rapor::STATUS_DIAJUKAN, 422, 'Hanya rapor berstatus Diajukan yang dapat divalidasi.');

        $data = $request->validate([
            'disetujui' => ['required', 'boolean'],
            'catatan_kepala_sekolah' => ['nullable', 'string'],
        ]);

        $rapor->update([
            'status' => $data['disetujui'] ? Rapor::STATUS_DIVALIDASI : Rapor::STATUS_DITOLAK,
            'catatan_kepala_sekolah' => $data['catatan_kepala_sekolah'] ?? null,
            'divalidasi_oleh' => $request->user()->id,
            'divalidasi_at' => now(),
        ]);

        return $rapor;
    }

    /** Terbitkan rapor yang sudah divalidasi (siap dicetak/diakses ortu) */
    public function terbitkan(Request $request, Rapor $rapor)
    {
        abort_unless($request->user()->hasRole('kepala_sekolah', 'admin'), 403);
        abort_unless($rapor->status === Rapor::STATUS_DIVALIDASI, 422, 'Rapor harus divalidasi terlebih dahulu.');

        $rapor->update(['status' => Rapor::STATUS_DITERBITKAN]);

        return $rapor;
    }

    /**
     * Komposisi data rapor bilingual (Arab & Latin) untuk halaman cetak.
     * Hanya tersedia untuk rapor berstatus Diterbitkan; guru_pesantren dikecualikan.
     */
    public function cetak(Request $request, Rapor $rapor)
    {
        $user = $request->user();
        abort_unless($rapor->status === Rapor::STATUS_DITERBITKAN, 422, 'Rapor hanya dapat dicetak setelah diterbitkan.');

        abort_unless(
            $user->hasRole('admin', 'kepala_sekolah')
            || ($user->hasRole('wali_kelas') && $rapor->siswa->kelasRombel?->wali_kelas_id === $user->id)
            || ($user->hasRole('siswa') && $rapor->siswa->user_id === $user->id)
            || ($user->hasRole('orang_tua') && $rapor->siswa->anakWali()->where('users.id', $user->id)->exists()),
            403,
            'Anda tidak berhak mencetak rapor ini.'
        );

        return response()->json($this->komposisiCetak($rapor));
    }

    private function komposisiCetak(Rapor $rapor): array
    {
        $siswa = $rapor->siswa->load('kelasRombel');
        $semester = $rapor->semester;
        $kelas = $siswa->kelasRombel;

        $mapel = $this->dataMapel($siswa->id, $semester->id);
        $total = 0;
        $jumlahMapelTerisi = 0;
        foreach ($mapel as &$row) {
            if ($row['nilai'] !== null) {
                $total += (int) $row['nilai'];
                $jumlahMapelTerisi++;
            }
        }
        unset($row);
        $rata2 = $jumlahMapelTerisi > 0 ? round($total / $jumlahMapelTerisi, 2) : 0;
        $peringkat = $this->hitungPeringkat($siswa->kelas_rombel_id, $semester->id, $siswa->id);

        $praktik = PraktikItem::orderBy('urutan')->get()
            ->map(fn (PraktikItem $item) => [
                'kode' => $item->kode,
                'nama_id' => $item->nama_id,
                'nama_ar' => $item->nama_ar,
                'nilai' => NilaiPraktik::where('siswa_id', $siswa->id)->where('semester_id', $semester->id)->where('praktik_item_id', $item->id)->value('nilai'),
                'keterangan' => NilaiPraktik::where('siswa_id', $siswa->id)->where('semester_id', $semester->id)->where('praktik_item_id', $item->id)->value('keterangan'),
            ])->all();

        $pembiasaan = Pembiasaan::where('siswa_id', $siswa->id)->where('semester_id', $semester->id)->value('nilai');
        $sikap = Sikap::where('siswa_id', $siswa->id)->where('semester_id', $semester->id)->first();
        $kehadiran = KehadiranRekap::where('siswa_id', $siswa->id)->where('semester_id', $semester->id)->first();

        $waliNama = $kelas?->waliKelas?->name;

        return [
            'status' => $rapor->status,
            'sekolah' => Sekolah::profil(),
            'siswa' => [
                'id' => $siswa->id,
                'nama' => $siswa->nama,
                'nis' => $siswa->nis,
            ],
            'kelas' => $kelas ? ['nama' => $kelas->nama, 'tingkat' => $kelas->tingkat] : null,
            'wali_kelas' => $waliNama,
            'semester' => [
                'nama' => $semester->nama,
                'tahun' => $semester->tahunAjaran->nama,
                'tempat_tanggal_rapot' => $semester->tempat_tanggal_rapot,
            ],
            'mapel' => $mapel,
            'total' => $total,
            'rata2' => $rata2,
            'rata2_bulat' => (int) round($rata2),
            'peringkat' => $peringkat,
            'predikat' => $peringkat ? ArabBilangan::predikatByRank($peringkat) : null,
            'praktik' => $praktik,
            'pembiasaan' => $pembiasaan,
            'sikap' => $sikap ? ['akhlaq' => $sikap->akhlaq, 'kepribadian' => $sikap->kepribadian] : null,
            'kehadiran' => $kehadiran ? ['sakit' => $kehadiran->sakit, 'izin' => $kehadiran->izin, 'alpa' => $kehadiran->alpa] : null,
        ];
    }

    private function dataMapel(int $siswaId, int $semesterId): array
    {
        $efektif = NilaiDiniyah::nilaiPerMapel($siswaId, $semesterId);
        $directKkm = NilaiMapel::where('siswa_id', $siswaId)->where('semester_id', $semesterId)->pluck('kkm', 'mapel_plus_id');

        return MapelPlus::orderBy('urutan')->orderBy('kode')->get()
            ->map(function (MapelPlus $mapel) use ($efektif, $directKkm) {
                $nilai = $efektif->get($mapel->id);
                $kkm = $nilai !== null ? ($directKkm->get($mapel->id) ?? $mapel->kkm_default) : null;

                return [
                    'nama_id' => $mapel->nama,
                    'nama_ar' => $mapel->nama_ar,
                    'kkm' => $kkm,
                    'nilai' => $nilai,
                    'angka_arab' => $nilai !== null ? ArabBilangan::angkaArab($nilai) : null,
                    'terbilang' => $nilai !== null ? ArabBilangan::terbilangArab((int) $nilai) : null,
                    'ket_nilai' => $nilai !== null ? ArabBilangan::ketNilai((int) $nilai) : null,
                ];
            })->all();
    }

    private function hitungPeringkat(int $kelasId, int $semesterId, int $siswaId): ?int
    {
        $siswaDiKelas = Siswa::where('kelas_rombel_id', $kelasId)->pluck('id');
        if ($siswaDiKelas->isEmpty()) {
            return null;
        }

        $nilaiPef = [];
        foreach ($siswaDiKelas as $id) {
            $daftar = NilaiDiniyah::nilaiPerMapel($id, $semesterId)->filter(fn ($v) => $v !== null)->values();

            if ($daftar->isEmpty()) {
                continue;
            }

            $nilaiPef[$id] = $daftar->avg();
        }

        $diurut = collect($nilaiPef)->sortDesc();
        $peringkat = 1;
        foreach ($diurut as $id => $avg) {
            if ((int) $id === $siswaId) {
                return $peringkat;
            }
            $peringkat++;
        }

        return null;
    }
}
