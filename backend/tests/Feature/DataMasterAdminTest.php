<?php

namespace Tests\Feature;

use App\Models\Guru;
use App\Models\GuruMapelKelas;
use App\Models\JenisAssessment;
use App\Models\KelasRombel;
use App\Models\MapelPlus;
use App\Models\Nilai;
use App\Models\Rapor;
use App\Models\Semester;
use App\Models\Siswa;
use App\Models\TahunAjaran;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class DataMasterAdminTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    private TahunAjaran $tahun;

    private Semester $semester;

    private KelasRombel $kelas;

    private Siswa $siswa;

    private MapelPlus $mapel;

    protected function setUp(): void
    {
        parent::setUp();

        $this->admin = User::create([
            'name' => 'Admin Tes',
            'email' => 'admin-tes@sipp.test',
            'password' => Hash::make('password'),
            'role' => User::ROLE_ADMIN,
        ]);

        $this->tahun = TahunAjaran::create(['nama' => '2026/2027', 'is_aktif' => true]);
        $this->semester = Semester::create([
            'tahun_ajaran_id' => $this->tahun->id,
            'nama' => 'Ganjil',
            'is_aktif' => true,
            'penilaian_dibuka' => true,
        ]);
        $this->kelas = KelasRombel::create([
            'nama' => 'VII-A',
            'tingkat' => 7,
            'tahun_ajaran_id' => $this->tahun->id,
        ]);
        $this->siswa = Siswa::create([
            'nis' => '999001',
            'nama' => 'Siswa Tes',
            'jenis_kelamin' => 'L',
            'kelas_rombel_id' => $this->kelas->id,
        ]);
        $this->mapel = MapelPlus::create(['kode' => 'TES', 'nama' => 'Tahfidz Tes']);
    }

    public function test_guru_tidak_bisa_dihapus_jika_masih_mengampu(): void
    {
        $user = User::create([
            'name' => 'Guru Tes',
            'email' => 'guru-tes@sipp.test',
            'password' => Hash::make('password'),
            'role' => User::ROLE_GURU_PESANTREN,
        ]);
        $guru = Guru::create(['user_id' => $user->id, 'nama' => 'Guru Tes']);

        GuruMapelKelas::create([
            'guru_id' => $guru->id,
            'mapel_plus_id' => $this->mapel->id,
            'kelas_rombel_id' => $this->kelas->id,
            'semester_id' => $this->semester->id,
        ]);

        $this->actingAs($this->admin, 'sanctum')
            ->deleteJson("/api/guru/{$guru->id}")
            ->assertStatus(422);

        GuruMapelKelas::query()->delete();

        $this->actingAs($this->admin, 'sanctum')
            ->deleteJson("/api/guru/{$guru->id}")
            ->assertStatus(204);

        $this->assertDatabaseMissing('gurus', ['id' => $guru->id]);
    }

    public function test_mapel_plus_tidak_bisa_dihapus_jika_memiliki_nilai(): void
    {
        $jenis = JenisAssessment::create([
            'mapel_plus_id' => $this->mapel->id,
            'nama' => 'Ujian',
            'kategori' => 'sumatif',
            'bobot' => 100,
        ]);
        Nilai::create([
            'siswa_id' => $this->siswa->id,
            'jenis_assessment_id' => $jenis->id,
            'semester_id' => $this->semester->id,
            'nilai' => 90,
            'dicatat_oleh' => $this->admin->id,
        ]);

        $this->actingAs($this->admin, 'sanctum')
            ->deleteJson("/api/mapel-plus/{$this->mapel->id}")
            ->assertStatus(422);

        $this->assertDatabaseHas('mapel_plus', ['id' => $this->mapel->id]);
    }

    public function test_jenis_assessment_bisa_diupdate_dan_dihapus_saat_kosong(): void
    {
        $jenis = JenisAssessment::create([
            'mapel_plus_id' => $this->mapel->id,
            'nama' => 'Ujian Lama',
            'kategori' => 'sumatif',
            'bobot' => 50,
        ]);

        $this->actingAs($this->admin, 'sanctum')
            ->putJson("/api/jenis-assessment/{$jenis->id}", ['nama' => 'Ujian Baru', 'kategori' => 'sumatif', 'bobot' => 70])
            ->assertStatus(200);
        $this->assertSame('Ujian Baru', $jenis->fresh()->nama);
        $this->assertEquals(70, (float) $jenis->fresh()->bobot);

        // Ada nilai → tidak boleh dihapus
        Nilai::create([
            'siswa_id' => $this->siswa->id,
            'jenis_assessment_id' => $jenis->id,
            'semester_id' => $this->semester->id,
            'nilai' => 85,
            'dicatat_oleh' => $this->admin->id,
        ]);
        $this->actingAs($this->admin, 'sanctum')
            ->deleteJson("/api/jenis-assessment/{$jenis->id}")
            ->assertStatus(422);

        Nilai::query()->delete();

        $this->actingAs($this->admin, 'sanctum')
            ->deleteJson("/api/jenis-assessment/{$jenis->id}")
            ->assertStatus(204);
    }

    public function test_kelas_tidak_bisa_dihapus_jika_memiliki_siswa(): void
    {
        $this->actingAs($this->admin, 'sanctum')
            ->deleteJson("/api/kelas-rombel/{$this->kelas->id}")
            ->assertStatus(422);

        $this->assertDatabaseHas('kelas_rombels', ['id' => $this->kelas->id]);
    }

    public function test_tahun_ajaran_baru_otomatis_dibekali_semester_ganjil_genap(): void
    {
        $this->actingAs($this->admin, 'sanctum')
            ->postJson('/api/tahun-ajaran', ['nama' => '2027/2028'])
            ->assertStatus(201)
            ->assertJsonCount(2, 'semesters');

        $this->assertDatabaseHas('semesters', ['tahun_ajaran_id' => 2, 'nama' => 'Ganjil']);
        $this->assertDatabaseHas('semesters', ['tahun_ajaran_id' => 2, 'nama' => 'Genap']);
    }

    public function test_semester_duplikat_dalam_satu_tahun_ajaran_ditolak(): void
    {
        $this->actingAs($this->admin, 'sanctum')
            ->postJson('/api/semester', [
                'tahun_ajaran_id' => $this->tahun->id,
                'nama' => 'Ganjil',
            ])
            ->assertStatus(422);
    }

    public function test_tahun_ajaran_tidak_bisa_dihapus_jika_memiliki_kelas(): void
    {
        $this->actingAs($this->admin, 'sanctum')
            ->deleteJson("/api/tahun-ajaran/{$this->tahun->id}")
            ->assertStatus(422);

        $this->assertDatabaseHas('tahun_ajarans', ['id' => $this->tahun->id]);
    }

    public function test_semester_tidak_bisa_dihapus_jika_memiliki_rapor(): void
    {
        Rapor::create([
            'siswa_id' => $this->siswa->id,
            'semester_id' => $this->semester->id,
            'status' => Rapor::STATUS_DRAFT,
        ]);

        $this->actingAs($this->admin, 'sanctum')
            ->deleteJson("/api/semester/{$this->semester->id}")
            ->assertStatus(422);

        Rapor::query()->delete();

        $this->actingAs($this->admin, 'sanctum')
            ->deleteJson("/api/semester/{$this->semester->id}")
            ->assertStatus(204);
    }
}
