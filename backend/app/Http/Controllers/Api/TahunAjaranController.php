<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\DeskripsiCapaian;
use App\Models\GuruMapelKelas;
use App\Models\KelasRombel;
use App\Models\Nilai;
use App\Models\Semester;
use App\Models\Siswa;
use App\Models\SiswaKelas;
use App\Models\TahunAjaran;
use Illuminate\Http\Request;

class TahunAjaranController extends Controller
{
    public function index()
    {
        return TahunAjaran::with(['semesters' => fn ($q) => $q->orderBy('nama')->orderBy('jenis')])->latest()->get();
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'nama' => ['required', 'string', 'max:20'],
            'is_aktif' => ['boolean'],
        ]);

        $tahunAjaran = TahunAjaran::create($data);

        // Tahun ajaran baru otomatis dibekali semester Ganjil & Genap (jenis Akhir)
        // (sesuai janji form admin); statusnya menyusul diaktifkan admin.
        // Wadah "Sementara" (rapor tengah semester) ditambahkan manual oleh admin.
        foreach (['Ganjil', 'Genap'] as $nama) {
            Semester::firstOrCreate(
                ['tahun_ajaran_id' => $tahunAjaran->id, 'nama' => $nama, 'jenis' => 'Akhir'],
                ['is_aktif' => false, 'penilaian_dibuka' => false]
            );
        }

        return $tahunAjaran->load('semesters');
    }

    /**
     * Promosikan siswa ke tahun ajaran berikutnya ("naik kelas").
     * Patokan: tahun ajaran. Setiap siswa aktif yang tercatat di kelas TA sumber
     * dipindahkan ke kelas dengan nama sama (tingkat +1) di TA tujuan — kelas
     * tujuan dibuat otomatis bila belum ada. Siswa tingkat 9 tidak dipromosikan
     * (anggap lulus). Riwayat penempatan & nilai semester TA lama TETAP tersimpan.
     */
    public function promosi(Request $request, TahunAjaran $tahunAjaran)
    {
        $data = $request->validate([
            'tahun_ajaran_tujuan_id' => ['required', 'exists:tahun_ajarans,id', 'not_in:'.$tahunAjaran->id],
        ], [
            'tahun_ajaran_tujuan_id.not_in' => 'Tahun ajaran tujuan harus berbeda dari tahun ajaran sumber.',
        ]);

        $tujuan = TahunAjaran::findOrFail($data['tahun_ajaran_tujuan_id']);

        // Penempatan terbaru tiap siswa aktif pada TA sumber
        $penempatan = SiswaKelas::with(['siswa', 'kelasRombel'])
            ->whereHas('kelasRombel', fn ($q) => $q->where('tahun_ajaran_id', $tahunAjaran->id))
            ->whereHas('siswa', fn ($q) => $q->where('is_aktif', true))
            ->get()
            ->groupBy('siswa_id')
            ->map(fn ($rows) => $rows->sortByDesc('id')->first());

        $naik = 0;
        $lulus = 0;
        $kelasDibuat = [];

        foreach ($penempatan as $item) {
            $kelasLama = $item->kelasRombel;

            if ($kelasLama->tingkat >= 9) {
                $lulus++;

                continue;
            }

            $tingkatBaru = $kelasLama->tingkat + 1;
            $namaBaru = preg_replace('/^\d+/', (string) $tingkatBaru, $kelasLama->nama);

            $kelasTujuan = KelasRombel::where('nama', $namaBaru)
                ->where('tahun_ajaran_id', $tujuan->id)
                ->first();

            if (! $kelasTujuan) {
                $kelasTujuan = KelasRombel::create([
                    'nama' => $namaBaru,
                    'tingkat' => $tingkatBaru,
                    'tahun_ajaran_id' => $tujuan->id,
                ]);
                $kelasDibuat[] = $namaBaru;
            }

            SiswaKelas::firstOrCreate([
                'siswa_id' => $item->siswa_id,
                'kelas_rombel_id' => $kelasTujuan->id,
            ]);

            $item->siswa->update(['kelas_rombel_id' => $kelasTujuan->id]);
            $naik++;
        }

        return response()->json([
            'naik' => $naik,
            'lulus' => $lulus,
            'kelas_dibuat' => $kelasDibuat,
            'tahun_ajaran_tujuan' => $tujuan->nama,
        ]);
    }

    public function update(Request $request, TahunAjaran $tahunAjaran)
    {
        $data = $request->validate([
            'nama' => ['sometimes', 'string', 'max:20'],
            'is_aktif' => ['boolean'],
        ]);

        $tahunAjaran->update($data);

        return $tahunAjaran;
    }

    public function destroy(TahunAjaran $tahunAjaran)
    {
        $jumlahKelas = $tahunAjaran->kelasRombels()->count();
        if ($jumlahKelas > 0) {
            abort(422, "Tahun ajaran ini masih memiliki {$jumlahKelas} kelas. Hapus kelasnya terlebih dahulu.");
        }

        $semesterIds = $tahunAjaran->semesters()->pluck('id');
        $adaData = Nilai::whereIn('semester_id', $semesterIds)->exists()
            || DeskripsiCapaian::whereIn('semester_id', $semesterIds)->exists()
            || GuruMapelKelas::whereIn('semester_id', $semesterIds)->exists();
        if ($adaData) {
            abort(422, 'Tahun ajaran ini masih memiliki data nilai/penugasan. Tidak bisa dihapus.');
        }

        $tahunAjaran->delete();

        return response()->noContent();
    }
}
