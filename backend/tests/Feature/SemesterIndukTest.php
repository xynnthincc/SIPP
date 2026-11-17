<?php

namespace Tests\Feature;

use App\Models\Guru;
use App\Models\GuruMapelKelas;
use App\Models\Jadwal;
use App\Models\KelasRombel;
use App\Models\MapelPlus;
use App\Models\Semester;
use App\Models\Siswa;
use App\Models\TahunAjaran;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

/**
 * Revisi: semester Sementara adalah ANAK dari semester Akhir (parent).
 * Hanya penyimpanan NILAI yang memakai wadah itu sendiri; seluruh data
 * operasional (siswa, mapel, penugasan, jadwal, presensi) ikut induk.
 */
class SemesterIndukTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    private User $guru;

    private TahunAjaran $tahun;

    private Semester $akhir;

    private KelasRombel $kelas;

    private Siswa $siswa;

    private MapelPlus $mapel;

    protected function setUp(): void
    {
        parent::setUp();

        $this->admin = User::create([
            'name' => 'Admin Tes', 'email' => 'admin-si@sipp.test',
            'password' => Hash::make('password'), 'role' => User::ROLE_ADMIN,
        ]);
        $this->guru = User::create([
            'name' => 'Guru Ujian', 'email' => 'guru-si@sipp.test',
            'password' => Hash::make('password'), 'role' => User::ROLE_GURU_PESANTREN,
        ]);
        Guru::create(['user_id' => $this->guru->id, 'nama' => 'Guru Ujian']);

        $this->tahun = TahunAjaran::create(['nama' => '2026/2027', 'is_aktif' => true]);
        $this->akhir = Semester::create([
            'tahun_ajaran_id' => $this->tahun->id, 'nama' => 'Ganjil', 'jenis' => 'Akhir',
            'is_aktif' => true, 'penilaian_dibuka' => true,
        ]);
        $this->kelas = KelasRombel::create([
            'nama' => '7A', 'tingkat' => 7, 'tahun_ajaran_id' => $this->tahun->id,
        ]);
        $this->siswa = Siswa::create([
            'nis' => '993001', 'nama' => 'Siswa Induk', 'jenis_kelamin' => 'L',
            'kelas_rombel_id' => $this->kelas->id,
        ]);
        $this->mapel = MapelPlus::create(['kode' => 'TAHFIDZ', 'nama' => 'Tahfidz', 'kkm_default' => 75]);

        GuruMapelKelas::create([
            'guru_id' => $this->guru->guru->id,
            'mapel_plus_id' => $this->mapel->id,
            'kelas_rombel_id' => $this->kelas->id,
            'semester_id' => $this->akhir->id,
        ]);
    }

    private function buatSementara(): Semester
    {
        $res = $this->actingAs($this->admin, 'sanctum')
            ->postJson('/api/semester', [
                'tahun_ajaran_id' => $this->tahun->id,
                'nama' => 'Ganjil',
                'jenis' => 'Sementara',
            ])
            ->assertStatus(201);

        return Semester::findOrFail($res->json('id'));
    }

    public function test_sementara_otomatis_menunjuk_induk_akhir(): void
    {
        $sementara = $this->buatSementara();

        $this->assertEquals($this->akhir->id, $sementara->parent_id);
        $this->assertEquals($this->akhir->id, $sementara->induk()->id);
        $this->assertEquals($this->akhir->id, $this->akhir->induk()->id);
    }

    public function test_sementara_ditolak_bila_belum_ada_akhir(): void
    {
        $this->akhir->delete();

        $this->actingAs($this->admin, 'sanctum')
            ->postJson('/api/semester', [
                'tahun_ajaran_id' => $this->tahun->id,
                'nama' => 'Ganjil',
                'jenis' => 'Sementara',
            ])
            ->assertStatus(422);
    }

    public function test_induk_tidak_bisa_dihapus_selama_punya_anak(): void
    {
        $this->buatSementara();

        $this->actingAs($this->admin, 'sanctum')
            ->deleteJson("/api/semester/{$this->akhir->id}")
            ->assertStatus(422);
    }

    public function test_penugasan_dibuat_di_wadah_sementara_tersimpan_di_induk(): void
    {
        $sementara = $this->buatSementara();
        $mapel2 = MapelPlus::create(['kode' => 'TAHSIN', 'nama' => 'Tahsin', 'kkm_default' => 75]);

        $this->actingAs($this->admin, 'sanctum')
            ->postJson('/api/guru-mapel-kelas', [
                'guru_id' => $this->guru->guru->id,
                'mapel_plus_id' => $mapel2->id,
                'kelas_rombel_id' => $this->kelas->id,
                'semester_id' => $sementara->id,
            ])
            ->assertStatus(201)
            ->assertJsonPath('semester_id', $this->akhir->id);

        $this->assertDatabaseMissing('guru_mapel_kelas', [
            'mapel_plus_id' => $mapel2->id, 'semester_id' => $sementara->id,
        ]);
    }

    public function test_pengampuan_saya_filter_sementara_mengembalikan_penugasan_induk(): void
    {
        $sementara = $this->buatSementara();

        $this->actingAs($this->guru, 'sanctum')
            ->getJson('/api/pengampuan-saya?semester_id='.$sementara->id)
            ->assertStatus(200)
            ->assertJsonCount(1)
            ->assertJsonPath('0.mapel_plus.id', $this->mapel->id);
    }

    public function test_nilai_sementara_terpisah_dari_akhir_tapi_satu_penugasan(): void
    {
        $sementara = $this->buatSementara();
        $sementara->update(['penilaian_dibuka' => true]);

        // Input ke wadah Sementara sah lewat penugasan induk
        $this->actingAs($this->guru, 'sanctum')
            ->postJson('/api/nilai-diniyah/massal', [
                'mapel_plus_id' => $this->mapel->id,
                'kelas_rombel_id' => $this->kelas->id,
                'semester_id' => $sementara->id,
                'nilai' => [['siswa_id' => $this->siswa->id, 'nilai' => 77]],
            ])
            ->assertStatus(200);

        // Rapor sementara menampilkan 77; rapor akhir tetap kosong (wadah terpisah)
        $this->actingAs($this->admin, 'sanctum')
            ->getJson('/api/rapor/cetak?siswa_id='.$this->siswa->id.'&semester_id='.$sementara->id)
            ->assertStatus(200)
            ->assertJsonPath('mapel.0.nilai', 77);

        $this->actingAs($this->admin, 'sanctum')
            ->getJson('/api/rapor/cetak?siswa_id='.$this->siswa->id.'&semester_id='.$this->akhir->id)
            ->assertStatus(200)
            ->assertJsonPath('mapel.0.nilai', null);
    }

    public function test_presensi_kumulatif_sementara_dan_akhir_satu_pool(): void
    {
        $sementara = $this->buatSementara();
        $jadwal = Jadwal::create([
            'guru_mapel_kelas_id' => GuruMapelKelas::first()->id,
            'hari' => 'Senin', 'jam_mulai' => '07:00', 'jam_selesai' => '08:00',
        ]);

        // 3 hari sakit (paruh pertama) + 2 hari sakit (paruh kedua)
        foreach (['2026-09-01', '2026-09-02', '2026-09-03', '2026-10-01', '2026-10-02'] as $tgl) {
            $this->actingAs($this->guru, 'sanctum')
                ->postJson('/api/presensi/massal', [
                    'jadwal_id' => $jadwal->id,
                    'tanggal' => $tgl,
                    'presensi' => [['siswa_id' => $this->siswa->id, 'status' => 'Sakit']],
                ])
                ->assertStatus(200);
        }

        // Rapor sementara maupun akhir membaca pool yang sama: total 5, bukan terpisah
        foreach ([$sementara->id, $this->akhir->id] as $semesterId) {
            $this->actingAs($this->admin, 'sanctum')
                ->getJson('/api/rapor/cetak?siswa_id='.$this->siswa->id.'&semester_id='.$semesterId)
                ->assertStatus(200)
                ->assertJsonPath('kehadiran.sakit', 5);
        }
    }
}
