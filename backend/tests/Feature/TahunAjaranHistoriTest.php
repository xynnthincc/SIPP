<?php

namespace Tests\Feature;

use App\Models\KelasRombel;
use App\Models\MapelPlus;
use App\Models\NilaiMapel;
use App\Models\Semester;
use App\Models\Siswa;
use App\Models\SiswaKelas;
use App\Models\TahunAjaran;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

/**
 * Revisi: tahun ajaran sebagai patokan sejarah — siswa naik kelas tiap TA,
 * penempatan per TA tersimpan (siswa_kelas), nilai rapor per semester TIDAK PERNAH hilang.
 */
class TahunAjaranHistoriTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    private User $waliTahun1;

    private TahunAjaran $ta1;

    private TahunAjaran $ta2;

    private Semester $semesterTa1;

    private Semester $semesterTa2;

    private KelasRombel $kelas7a;

    private MapelPlus $mapel;

    protected function setUp(): void
    {
        parent::setUp();

        $this->admin = User::create([
            'name' => 'Admin Tes', 'email' => 'admin-th@sipp.test',
            'password' => Hash::make('password'), 'role' => User::ROLE_ADMIN,
        ]);
        $this->waliTahun1 = User::create([
            'name' => 'Wali TA1', 'email' => 'wali-th1@sipp.test',
            'password' => Hash::make('password'), 'role' => User::ROLE_WALI_KELAS,
        ]);

        $this->ta1 = TahunAjaran::create(['nama' => '2025/2026']);
        $this->ta2 = TahunAjaran::create(['nama' => '2026/2027', 'is_aktif' => true]);

        $this->semesterTa1 = Semester::create([
            'tahun_ajaran_id' => $this->ta1->id, 'nama' => 'Ganjil', 'jenis' => 'Akhir',
        ]);
        $this->semesterTa2 = Semester::create([
            'tahun_ajaran_id' => $this->ta2->id, 'nama' => 'Ganjil', 'jenis' => 'Akhir', 'is_aktif' => true,
        ]);

        $this->kelas7a = KelasRombel::create([
            'nama' => '7A', 'tingkat' => 7, 'tahun_ajaran_id' => $this->ta1->id,
            'wali_kelas_id' => $this->waliTahun1->id,
        ]);

        $this->mapel = MapelPlus::create(['kode' => 'TAHFIDZ', 'nama' => 'Tahfidz', 'kkm_default' => 75]);
    }

    private function buatSiswaDiKelas(string $nis, string $nama, KelasRombel $kelas, int $nilai): Siswa
    {
        $siswa = Siswa::create([
            'nis' => $nis, 'nama' => $nama, 'jenis_kelamin' => 'L',
            'kelas_rombel_id' => $kelas->id,
        ]);
        SiswaKelas::firstOrCreate(['siswa_id' => $siswa->id, 'kelas_rombel_id' => $kelas->id]);
        NilaiMapel::create([
            'siswa_id' => $siswa->id, 'mapel_plus_id' => $this->mapel->id,
            'semester_id' => $this->semesterTa1->id, 'kkm' => 75, 'nilai' => $nilai,
        ]);

        return $siswa;
    }

    public function test_promosi_menaikkan_siswa_dan_rapor_tahun_lama_tetap_utuh(): void
    {
        $siswaA = $this->buatSiswaDiKelas('980001', 'Siswa A', $this->kelas7a, 90);
        $siswaB = $this->buatSiswaDiKelas('980002', 'Siswa B', $this->kelas7a, 80);

        $this->actingAs($this->admin, 'sanctum')
            ->postJson("/api/tahun-ajaran/{$this->ta1->id}/promosi", [
                'tahun_ajaran_tujuan_id' => $this->ta2->id,
            ])
            ->assertStatus(200)
            ->assertJsonPath('naik', 2)
            ->assertJsonPath('lulus', 0)
            ->assertJsonPath('kelas_dibuat', ['8A']);

        // Siswa pindah ke kelas 8A di TA2 (dibuat otomatis)
        $this->assertEquals('8A', $siswaA->fresh()->kelasRombel->nama);
        $this->assertEquals($this->ta2->id, $siswaA->fresh()->kelasRombel->tahun_ajaran_id);

        // Rapor semester TA1: kelas tetap 7A, wali tetap Wali TA1, peringkat dihitung di antara anggota 7A
        $res = $this->actingAs($this->admin, 'sanctum')
            ->getJson('/api/rapor/cetak?siswa_id='.$siswaA->id.'&semester_id='.$this->semesterTa1->id)
            ->assertStatus(200)
            ->assertJsonPath('kelas.nama', '7A')
            ->assertJsonPath('kelas.tingkat', 7)
            ->assertJsonPath('wali_kelas', 'Wali TA1')
            ->assertJsonPath('peringkat', 1)
            ->assertJsonPath('mapel.0.nilai', 90);

        // Siswa B peringkat 2 di kelas 7A semester TA1 (historis)
        $this->actingAs($this->admin, 'sanctum')
            ->getJson('/api/rapor/cetak?siswa_id='.$siswaB->id.'&semester_id='.$this->semesterTa1->id)
            ->assertStatus(200)
            ->assertJsonPath('kelas.nama', '7A')
            ->assertJsonPath('peringkat', 2);

        // Rapor semester TA2 (belum ada nilai): kelas baru 8A
        $this->actingAs($this->admin, 'sanctum')
            ->getJson('/api/rapor/cetak?siswa_id='.$siswaA->id.'&semester_id='.$this->semesterTa2->id)
            ->assertStatus(200)
            ->assertJsonPath('kelas.nama', '8A')
            ->assertJsonPath('mapel.0.nilai', null);

        // Nilai semester lama tidak tersentuh
        $this->assertDatabaseHas('nilai_mapels', [
            'siswa_id' => $siswaA->id, 'semester_id' => $this->semesterTa1->id, 'nilai' => 90,
        ]);
    }

    public function test_promosi_melewati_siswa_tingkat_9(): void
    {
        $kelas9 = KelasRombel::create([
            'nama' => '9A', 'tingkat' => 9, 'tahun_ajaran_id' => $this->ta1->id,
        ]);
        $siswa9 = $this->buatSiswaDiKelas('980009', 'Siswa Sembilan', $kelas9, 85);

        $this->actingAs($this->admin, 'sanctum')
            ->postJson("/api/tahun-ajaran/{$this->ta1->id}/promosi", [
                'tahun_ajaran_tujuan_id' => $this->ta2->id,
            ])
            ->assertStatus(200)
            ->assertJsonPath('naik', 0)
            ->assertJsonPath('lulus', 1);

        // Tetap di kelas 9A
        $this->assertEquals('9A', $siswa9->fresh()->kelasRombel->nama);
    }

    public function test_promosi_bisa_diulang_tanpa_duplikasi(): void
    {
        $siswa = $this->buatSiswaDiKelas('980010', 'Siswa Idempoten', $this->kelas7a, 88);

        $this->actingAs($this->admin, 'sanctum')
            ->postJson("/api/tahun-ajaran/{$this->ta1->id}/promosi", ['tahun_ajaran_tujuan_id' => $this->ta2->id])
            ->assertStatus(200);

        $this->actingAs($this->admin, 'sanctum')
            ->postJson("/api/tahun-ajaran/{$this->ta1->id}/promosi", ['tahun_ajaran_tujuan_id' => $this->ta2->id])
            ->assertStatus(200)
            ->assertJsonPath('naik', 1);

        $jumlah = SiswaKelas::where('siswa_id', $siswa->id)
            ->whereHas('kelasRombel', fn ($q) => $q->where('tahun_ajaran_id', $this->ta2->id))
            ->count();
        $this->assertEquals(1, $jumlah);
    }

    public function test_siswa_pindah_kelas_rapor_semester_lama_pakai_kelas_saat_itu(): void
    {
        $siswa = $this->buatSiswaDiKelas('980011', 'Siswa Pindah', $this->kelas7a, 87);

        // Pindah kelas via update (mis. pindah rombel sesama TA1)
        $kelas7b = KelasRombel::create([
            'nama' => '7B', 'tingkat' => 7, 'tahun_ajaran_id' => $this->ta1->id,
        ]);
        $this->actingAs($this->admin, 'sanctum')
            ->putJson("/api/siswa/{$siswa->id}", ['kelas_rombel_id' => $kelas7b->id])
            ->assertStatus(200);

        // Rapor semester TA1 tetap menampilkan kelas terakhir yang dicatat untuk TA1 (7B),
        // bukan kelas saat ini yang mungkin sudah berpindah lagi
        $this->actingAs($this->admin, 'sanctum')
            ->getJson('/api/rapor/cetak?siswa_id='.$siswa->id.'&semester_id='.$this->semesterTa1->id)
            ->assertStatus(200)
            ->assertJsonPath('kelas.nama', '7B');
    }

    public function test_promosi_ditolak_bila_tujuan_sama_dengan_sumber(): void
    {
        $this->actingAs($this->admin, 'sanctum')
            ->postJson("/api/tahun-ajaran/{$this->ta1->id}/promosi", [
                'tahun_ajaran_tujuan_id' => $this->ta1->id,
            ])
            ->assertStatus(422);
    }

    public function test_hapus_kelas_dengan_riwayat_penempatan_ditolak(): void
    {
        $this->buatSiswaDiKelas('980012', 'Siswa Riwayat', $this->kelas7a, 85);
        // Pindahkan siswa keluar dari kelas (kelas sudah "kosong" secara current)
        Siswa::first()->update(['kelas_rombel_id' => null]);

        $this->actingAs($this->admin, 'sanctum')
            ->deleteJson("/api/kelas-rombel/{$this->kelas7a->id}")
            ->assertStatus(422);
    }
}
