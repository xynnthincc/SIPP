<?php

namespace Tests\Feature;

use App\Models\Guru;
use App\Models\GuruMapelKelas;
use App\Models\KelasRombel;
use App\Models\MapelPlus;
use App\Models\PraktikItem;
use App\Models\Rapor;
use App\Models\Semester;
use App\Models\Siswa;
use App\Models\TahunAjaran;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class RaporDiniyahTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    private User $wali;

    private User $guru;

    private Semester $semester;

    private KelasRombel $kelas;

    private Siswa $siswa;

    private MapelPlus $mapel;

    private PraktikItem $praktik;

    protected function setUp(): void
    {
        parent::setUp();

        $this->admin = User::create([
            'name' => 'Admin Tes',
            'email' => 'admin-tes@sipp.test',
            'password' => Hash::make('password'),
            'role' => User::ROLE_ADMIN,
        ]);

        $this->wali = User::create([
            'name' => 'Wali Kelas Tes',
            'email' => 'wali-tes@sipp.test',
            'password' => Hash::make('password'),
            'role' => User::ROLE_WALI_KELAS,
        ]);

        $this->guru = User::create([
            'name' => 'Guru Ujian',
            'email' => 'guru-ujian@sipp.test',
            'password' => Hash::make('password'),
            'role' => User::ROLE_GURU_PESANTREN,
        ]);
        Guru::create(['user_id' => $this->guru->id, 'nama' => 'Guru Ujian']);

        $tahun = TahunAjaran::create(['nama' => '2026/2027', 'is_aktif' => true]);
        $this->semester = Semester::create([
            'tahun_ajaran_id' => $tahun->id,
            'nama' => 'Ganjil',
            'is_aktif' => true,
            'penilaian_dibuka' => true,
        ]);
        $this->kelas = KelasRombel::create([
            'nama' => 'VII-A',
            'tingkat' => 7,
            'tahun_ajaran_id' => $tahun->id,
            'wali_kelas_id' => $this->wali->id,
        ]);
        $this->siswa = Siswa::create([
            'nis' => '999001',
            'nama' => 'Siswa Tes',
            'jenis_kelamin' => 'L',
            'kelas_rombel_id' => $this->kelas->id,
        ]);
        $this->mapel = MapelPlus::create(['kode' => 'TAHFIDZ', 'nama' => 'Tahfidz', 'kkm_default' => 75]);
        $this->praktik = PraktikItem::create(['kode' => 'WUDHU', 'nama_id' => 'Wudhu', 'urutan' => 1]);

        GuruMapelKelas::create([
            'guru_id' => $this->guru->guru->id,
            'mapel_plus_id' => $this->mapel->id,
            'kelas_rombel_id' => $this->kelas->id,
            'semester_id' => $this->semester->id,
        ]);

        $this->guru->guru->praktikItems()->attach($this->praktik->id);
    }

    public function test_wali_kelas_simpan_semua_seksi_nilai_diniyah(): void
    {
        $this->actingAs($this->wali, 'sanctum')
            ->postJson('/api/nilai-diniyah/simpan', [
                'siswa_id' => $this->siswa->id,
                'semester_id' => $this->semester->id,
                'nilai_mapel' => [
                    ['mapel_plus_id' => $this->mapel->id, 'kkm' => 75, 'nilai' => 85],
                ],
                'nilai_praktik' => [
                    ['praktik_item_id' => $this->praktik->id, 'nilai' => 'A', 'keterangan' => 'Lancar'],
                ],
                'pembiasaan' => ['nilai' => 90],
                'sikap' => ['akhlaq' => 'A', 'kepribadian' => 'B'],
                'kehadiran' => ['sakit' => 1, 'izin' => 2, 'alpa' => 0],
            ])
            ->assertStatus(200)
            ->assertJson(['message' => 'Nilai diniyah berhasil disimpan.']);

        $this->assertDatabaseHas('nilai_mapels', [
            'siswa_id' => $this->siswa->id,
            'mapel_plus_id' => $this->mapel->id,
            'semester_id' => $this->semester->id,
            'kkm' => 75,
            'nilai' => 85,
        ]);
        $this->assertDatabaseHas('nilai_praktiks', [
            'siswa_id' => $this->siswa->id,
            'praktik_item_id' => $this->praktik->id,
            'semester_id' => $this->semester->id,
            'nilai' => 'A',
        ]);
        $this->assertDatabaseHas('pembiasaans', ['siswa_id' => $this->siswa->id, 'semester_id' => $this->semester->id, 'nilai' => 90]);
        $this->assertDatabaseHas('sikaps', ['siswa_id' => $this->siswa->id, 'akhlaq' => 'A', 'kepribadian' => 'B']);
        $this->assertDatabaseHas('kehadiran_rekaps', ['siswa_id' => $this->siswa->id, 'sakit' => 1, 'izin' => 2, 'alpa' => 0]);
        $this->assertDatabaseHas('log_edit_nilais', ['siswa_id' => $this->siswa->id, 'semester_id' => $this->semester->id, 'updated_by' => $this->wali->id]);
    }

    public function test_guru_mengampu_boleh_simpan_nilai_mapel_dan_praktiknya(): void
    {
        $this->actingAs($this->guru, 'sanctum')
            ->postJson('/api/nilai-diniyah/simpan', [
                'siswa_id' => $this->siswa->id,
                'semester_id' => $this->semester->id,
                'nilai_mapel' => [
                    ['mapel_plus_id' => $this->mapel->id, 'kkm' => 75, 'nilai' => 75],
                ],
                'nilai_praktik' => [
                    ['praktik_item_id' => $this->praktik->id, 'nilai' => 'B'],
                ],
            ])
            ->assertStatus(200);

        $this->assertDatabaseHas('nilai_mapels', ['siswa_id' => $this->siswa->id, 'nilai' => 75]);
        $this->assertDatabaseHas('nilai_praktiks', ['siswa_id' => $this->siswa->id, 'nilai' => 'B']);
    }

    public function test_guru_tidak_bisa_mengisi_pembiasaan_sikap_dan_kehadiran(): void
    {
        $this->actingAs($this->guru, 'sanctum')
            ->postJson('/api/nilai-diniyah/simpan', [
                'siswa_id' => $this->siswa->id,
                'semester_id' => $this->semester->id,
                'kehadiran' => ['sakit' => 1, 'izin' => 0, 'alpa' => 0],
            ])
            ->assertStatus(403);
    }

    public function test_penilaian_ditutup_menolak_penyimpanan(): void
    {
        $this->semester->update(['penilaian_dibuka' => false]);

        $this->actingAs($this->admin, 'sanctum')
            ->postJson('/api/nilai-diniyah/simpan', [
                'siswa_id' => $this->siswa->id,
                'semester_id' => $this->semester->id,
                'nilai_mapel' => [['mapel_plus_id' => $this->mapel->id, 'kkm' => 75, 'nilai' => 80]],
            ])
            ->assertStatus(422);
    }

    public function test_cetak_rapor_hanya_untuk_status_diterbitkan(): void
    {
        $this->actingAs($this->admin, 'sanctum')
            ->postJson('/api/nilai-diniyah/simpan', [
                'siswa_id' => $this->siswa->id,
                'semester_id' => $this->semester->id,
                'nilai_mapel' => [['mapel_plus_id' => $this->mapel->id, 'kkm' => 75, 'nilai' => 85]],
            ]);

        $rapor = Rapor::create([
            'siswa_id' => $this->siswa->id,
            'semester_id' => $this->semester->id,
            'status' => Rapor::STATUS_DRAFT,
        ]);

        $this->actingAs($this->admin, 'sanctum')
            ->getJson("/api/rapors/{$rapor->id}/cetak")
            ->assertStatus(422);

        $rapor->update(['status' => Rapor::STATUS_DITERBITKAN]);

        $this->actingAs($this->admin, 'sanctum')
            ->getJson("/api/rapors/{$rapor->id}/cetak")
            ->assertStatus(200)
            ->assertJsonPath('status', Rapor::STATUS_DITERBITKAN)
            ->assertJsonPath('siswa.id', $this->siswa->id)
            ->assertJsonPath('peringkat', 1)
            ->assertJsonPath('mapel.0.nilai', 85)
            ->assertJsonPath('mapel.0.terbilang', 'خمسة وثمانون');
    }

    public function test_guru_tidak_boleh_cetak_rapor(): void
    {
        $rapor = Rapor::create([
            'siswa_id' => $this->siswa->id,
            'semester_id' => $this->semester->id,
            'status' => Rapor::STATUS_DITERBITKAN,
        ]);

        $this->actingAs($this->guru, 'sanctum')
            ->getJson("/api/rapors/{$rapor->id}/cetak")
            ->assertStatus(403);
    }

    public function test_rekap_form_nilai_diniyah_mencantumkan_data_existing(): void
    {
        $this->actingAs($this->wali, 'sanctum')
            ->postJson('/api/nilai-diniyah/simpan', [
                'siswa_id' => $this->siswa->id,
                'semester_id' => $this->semester->id,
                'nilai_mapel' => [['mapel_plus_id' => $this->mapel->id, 'kkm' => 75, 'nilai' => 82]],
            ]);

        $this->actingAs($this->wali, 'sanctum')
            ->getJson('/api/nilai-diniyah/rekap?siswa_id='.$this->siswa->id.'&semester_id='.$this->semester->id)
            ->assertStatus(200)
            ->assertJsonPath('mapel.0.nilai_mapel.nilai', 82)
            ->assertJsonPath('mapel.0.bisa_edit', true)
            ->assertJsonPath('bisa_edit_pembiasaan', true)
            ->assertJsonPath('log_edit.updated_by', $this->wali->id);
    }
}