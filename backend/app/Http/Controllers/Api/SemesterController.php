<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\DeskripsiCapaian;
use App\Models\GuruMapelKelas;
use App\Models\Nilai;
use App\Models\Semester;
use Illuminate\Http\Request;

class SemesterController extends Controller
{
    public function index(Request $request)
    {
        return Semester::with('tahunAjaran')
            ->when($request->tahun_ajaran_id, fn ($q, $id) => $q->where('tahun_ajaran_id', $id))
            ->orderBy('nama')
            ->orderBy('jenis')
            ->get();
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'tahun_ajaran_id' => ['required', 'exists:tahun_ajarans,id'],
            'nama' => ['required', 'in:Ganjil,Genap'],
            'jenis' => ['nullable', 'in:Akhir,Sementara'],
            'is_aktif' => ['boolean'],
            'penilaian_dibuka' => ['boolean'],
        ]);
        $data['jenis'] ??= 'Akhir';

        $sudahAda = Semester::where('tahun_ajaran_id', $data['tahun_ajaran_id'])
            ->where('nama', $data['nama'])
            ->where('jenis', $data['jenis'])
            ->exists();
        abort_if($sudahAda, 422, "Semester {$data['nama']} ({$data['jenis']}) untuk tahun ajaran ini sudah ada.");

        // Sementara selalu anak dari Akhir bernama sama (wadah nilai terpisah,
        // operasional ikut induk) — induk wajib sudah ada lebih dulu.
        if ($data['jenis'] === 'Sementara') {
            $data['parent_id'] = $this->cariInduk($data['tahun_ajaran_id'], $data['nama']);
        }

        return Semester::create($data);
    }

    public function update(Request $request, Semester $semester)
    {
        $data = $request->validate([
            'jenis' => ['nullable', 'in:Akhir,Sementara'],
            'is_aktif' => ['boolean'],
            'penilaian_dibuka' => ['boolean'],
            'tempat_tanggal_rapot' => ['nullable', 'string', 'max:255'],
        ]);
        $data['jenis'] ??= $semester->jenis;

        $bentrok = isset($data['jenis']) && $data['jenis'] !== $semester->jenis
            && Semester::where('tahun_ajaran_id', $semester->tahun_ajaran_id)
                ->where('nama', $semester->nama)
                ->where('jenis', $data['jenis'])
                ->exists();
        abort_if($bentrok, 422, "Semester {$semester->nama} ({$data['jenis']}) untuk tahun ajaran ini sudah ada.");

        if ($data['jenis'] === 'Sementara') {
            $data['parent_id'] = $this->cariInduk($semester->tahun_ajaran_id, $semester->nama);
        } else {
            $data['parent_id'] = null;
        }

        $semester->update($data);

        return $semester;
    }

    public function destroy(Semester $semester)
    {
        $dipakai = collect([
            Nilai::where('semester_id', $semester->id)->exists(),
            DeskripsiCapaian::where('semester_id', $semester->id)->exists(),
            GuruMapelKelas::where('semester_id', $semester->id)->exists(),
            Semester::where('parent_id', $semester->id)->exists(),
        ])->contains(true);

        if ($dipakai) {
            abort(422, 'Semester ini masih memiliki data nilai/penugasan/semester turunan. Tidak bisa dihapus.');
        }

        $semester->delete();

        return response()->noContent();
    }

    /** Cari id semester Akhir bernama sama di TA yang sama untuk dijadikan induk. */
    private function cariInduk(int $tahunAjaranId, string $nama): int
    {
        $indukId = Semester::where('tahun_ajaran_id', $tahunAjaranId)
            ->where('nama', $nama)
            ->where('jenis', 'Akhir')
            ->value('id');

        abort_if($indukId === null, 422, "Buat semester {$nama} (Akhir) terlebih dahulu sebelum menambah wadah Sementara.");

        return $indukId;
    }
}
