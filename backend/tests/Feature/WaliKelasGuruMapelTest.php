<?php

namespace Tests\Feature;

use App\Models\Guru;
use App\Models\GuruMapelKelas;
use App\Models\Jadwal;
use App\Models\JenisAssessment;
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
 * Revisi: wali kelas juga bisa menjadi guru mapel — akses fitur guru dibuka
 * bagi pemilik profil guru (role apa pun) selama punya penugasan pengampu.
 */
class WaliKelasGuruMapelTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    private User $waliGuru;

    private User $waliBiasa;

    private User $guru;

    private Semester $semester;

    private KelasRombel $kelasBinaan;

    private KelasRombel $kelasLain;

    private Siswa $siswaBinaan;

    private Siswa $siswaLain;

    private MapelPlus $mapelDiampu;

    private MapelPlus $mapelLain;

    protected function setUp(): void
    {
        parent::setUp();

        $this->admin = User::create([
            'name' => 'Admin Tes', 'email' => 'admin-wg@sipp.test',
            'password' => Hash::make('password'), 'role' => User::ROLE_ADMIN,
        ]);

        // Wali kelas YANG JUGA mengajar: punya profil guru + penugasan pengampu
        $this->waliGuru = User::create([
            'name' => 'Wali Mengajar', 'email' => 'wali-guru@sipp.test',
            'password' => Hash::make('password'), 'role' => User::ROLE_WALI_KELAS,
        ]);
        Guru::create(['user_id' => $this->waliGuru->id, 'nama' => 'Wali Mengajar']);

        // Wali kelas murni (tanpa profil guru)
        $this->waliBiasa = User::create([
            'name' => 'Wali Murni', 'email' => 'wali-murni@sipp.test',
            'password' => Hash::make('password'), 'role' => User::ROLE_WALI_KELAS,
        ]);

        $this->guru = User::create([
            'name' => 'Guru Ujian', 'email' => 'guru-wg@sipp.test',
            'password' => Hash::make('password'), 'role' => User::ROLE_GURU_PESANTREN,
        ]);
        Guru::create(['user_id' => $this->guru->id, 'nama' => 'Guru Ujian']);

        $tahun = TahunAjaran::create(['nama' => '2026/2027', 'is_aktif' => true]);
        $this->semester = Semester::create([
            'tahun_ajaran_id' => $tahun->id, 'nama' => 'Ganjil',
            'is_aktif' => true, 'penilaian_dibuka' => true,
        ]);

        $this->kelasBinaan = KelasRombel::create([
            'nama' => '7A', 'tingkat' => 7, 'tahun_ajaran_id' => $tahun->id,
            'wali_kelas_id' => $this->waliGuru->id,
        ]);
        $this->kelasLain = KelasRombel::create([
            'nama' => '8A', 'tingkat' => 8, 'tahun_ajaran_id' => $tahun->id,
            'wali_kelas_id' => $this->waliBiasa->id,
        ]);

        $this->siswaBinaan = Siswa::create([
            'nis' => '990001', 'nama' => 'Siswa Binaan', 'jenis_kelamin' => 'L',
            'kelas_rombel_id' => $this->kelasBinaan->id,
        ]);
        $this->siswaLain = Siswa::create([
            'nis' => '990002', 'nama' => 'Siswa Kelas Lain', 'jenis_kelamin' => 'P',
            'kelas_rombel_id' => $this->kelasLain->id,
        ]);

        $this->mapelDiampu = MapelPlus::create(['kode' => 'TAHFIDZ', 'nama' => 'Tahfidz', 'kkm_default' => 75]);
        $this->mapelLain = MapelPlus::create(['kode' => 'TAHSIN', 'nama' => 'Tahsin', 'kkm_default' => 75]);

        // Penugasan: waliGuru mengampu Tahfidz di kelas 8A (kelas yang BUKAN binaannya)
        GuruMapelKelas::create([
            'guru_id' => $this->waliGuru->guru->id,
            'mapel_plus_id' => $this->mapelDiampu->id,
            'kelas_rombel_id' => $this->kelasLain->id,
            'semester_id' => $this->semester->id,
        ]);
    }

    public function test_pengampuan_saya_mengembalikan_penugasan_wali_yang_mengajar(): void
    {
        $this->actingAs($this->waliGuru, 'sanctum')
            ->getJson('/api/pengampuan-saya')
            ->assertStatus(200)
            ->assertJsonCount(1)
            ->assertJsonPath('0.mapel_plus.id', $this->mapelDiampu->id)
            ->assertJsonPath('0.kelas_rombel.id', $this->kelasLain->id);

        // Wali murni (tanpa profil guru) mendapat daftar kosong
        $this->actingAs($this->waliBiasa, 'sanctum')
            ->getJson('/api/pengampuan-saya')
            ->assertStatus(200)
            ->assertJsonCount(0);
    }

    public function test_wali_kelas_yang_mengajar_bisa_input_nilai_langsung_di_kelas_pengampuan(): void
    {
        $this->actingAs($this->waliGuru, 'sanctum')
            ->postJson('/api/nilai-diniyah/massal', [
                'mapel_plus_id' => $this->mapelDiampu->id,
                'kelas_rombel_id' => $this->kelasLain->id,
                'semester_id' => $this->semester->id,
                'nilai' => [['siswa_id' => $this->siswaLain->id, 'nilai' => 88]],
            ])
            ->assertStatus(200);

        $this->assertDatabaseHas('nilai_mapels', [
            'siswa_id' => $this->siswaLain->id,
            'mapel_plus_id' => $this->mapelDiampu->id,
            'nilai' => 88,
        ]);
    }

    public function test_wali_kelas_yang_mengajar_tidak_bisa_input_mapel_yang_tidak_diampu(): void
    {
        $this->actingAs($this->waliGuru, 'sanctum')
            ->postJson('/api/nilai-diniyah/massal', [
                'mapel_plus_id' => $this->mapelLain->id,
                'kelas_rombel_id' => $this->kelasLain->id,
                'semester_id' => $this->semester->id,
                'nilai' => [['siswa_id' => $this->siswaLain->id, 'nilai' => 80]],
            ])
            ->assertStatus(403);
    }

    public function test_wali_kelas_bisa_input_nilai_assesmen_untuk_mapel_yang_diampu(): void
    {
        $jenis = JenisAssessment::create([
            'mapel_plus_id' => $this->mapelDiampu->id,
            'nama' => 'Ujian Tengah Semester', 'kategori' => 'sumatif', 'bobot' => 25,
        ]);

        $this->actingAs($this->waliGuru, 'sanctum')
            ->postJson('/api/nilai/massal', [
                'jenis_assessment_id' => $jenis->id,
                'semester_id' => $this->semester->id,
                'nilai' => [['siswa_id' => $this->siswaLain->id, 'nilai' => 90]],
            ])
            ->assertStatus(200);

        // Mapel yang tidak diampu → ditolak
        $jenisLain = JenisAssessment::create([
            'mapel_plus_id' => $this->mapelLain->id,
            'nama' => 'Ujian Lain', 'kategori' => 'sumatif', 'bobot' => 25,
        ]);
        $this->actingAs($this->waliGuru, 'sanctum')
            ->postJson('/api/nilai/massal', [
                'jenis_assessment_id' => $jenisLain->id,
                'semester_id' => $this->semester->id,
                'nilai' => [['siswa_id' => $this->siswaLain->id, 'nilai' => 90]],
            ])
            ->assertStatus(403);
    }

    public function test_wali_murni_tanpa_profil_guru_ditolak_input_nilai_assesmen(): void
    {
        $jenis = JenisAssessment::create([
            'mapel_plus_id' => $this->mapelDiampu->id,
            'nama' => 'Ujian', 'kategori' => 'sumatif', 'bobot' => 25,
        ]);

        $this->actingAs($this->waliBiasa, 'sanctum')
            ->postJson('/api/nilai/massal', [
                'jenis_assessment_id' => $jenis->id,
                'semester_id' => $this->semester->id,
                'nilai' => [['siswa_id' => $this->siswaLain->id, 'nilai' => 90]],
            ])
            ->assertStatus(403);
    }

    public function test_jadwal_wali_kelas_yang_mengajar_scoped_ke_pengampuannya(): void
    {
        // Jadwal milik waliGuru & jadwal milik guru lain
        $pengampuanWali = GuruMapelKelas::first();
        $pengampuanGuru = GuruMapelKelas::create([
            'guru_id' => $this->guru->guru->id,
            'mapel_plus_id' => $this->mapelLain->id,
            'kelas_rombel_id' => $this->kelasBinaan->id,
            'semester_id' => $this->semester->id,
        ]);
        Jadwal::create(['guru_mapel_kelas_id' => $pengampuanWali->id, 'hari' => 'Senin', 'jam_mulai' => '07:00', 'jam_selesai' => '08:00']);
        Jadwal::create(['guru_mapel_kelas_id' => $pengampuanGuru->id, 'hari' => 'Selasa', 'jam_mulai' => '07:00', 'jam_selesai' => '08:00']);

        $this->actingAs($this->waliGuru, 'sanctum')
            ->getJson('/api/jadwal')
            ->assertStatus(200)
            ->assertJsonCount(1)
            ->assertJsonPath('0.guru_mapel_kelas.id', $pengampuanWali->id);
    }

    public function test_wali_kelas_yang_mengajar_bisa_input_presensi_jadwalnya(): void
    {
        $jadwal = Jadwal::create([
            'guru_mapel_kelas_id' => GuruMapelKelas::first()->id,
            'hari' => 'Senin', 'jam_mulai' => '07:00', 'jam_selesai' => '08:00',
        ]);

        $this->actingAs($this->waliGuru, 'sanctum')
            ->postJson('/api/presensi/massal', [
                'jadwal_id' => $jadwal->id,
                'tanggal' => '2026-09-21',
                'presensi' => [['siswa_id' => $this->siswaLain->id, 'status' => 'Hadir']],
            ])
            ->assertStatus(200);

        $this->assertDatabaseHas('presensis', [
            'siswa_id' => $this->siswaLain->id, 'jadwal_id' => $jadwal->id, 'tanggal' => '2026-09-21 00:00:00',
        ]);
    }

    public function test_wali_kelas_yang_mengajar_bisa_membuat_catatan_guru(): void
    {
        $this->actingAs($this->waliGuru, 'sanctum')
            ->postJson('/api/catatan-guru', [
                'siswa_id' => $this->siswaLain->id,
                'tanggal' => '2026-09-21',
                'catatan' => 'Hafalan bagus hari ini.',
            ])
            ->assertStatus(201)
            ->assertJsonPath('guru.id', $this->waliGuru->guru->id);
    }

    public function test_guru_bisa_mengampu_banyak_mapel_dan_terlihat_di_pengampuan_saya(): void
    {
        GuruMapelKelas::create([
            'guru_id' => $this->guru->guru->id,
            'mapel_plus_id' => $this->mapelDiampu->id,
            'kelas_rombel_id' => $this->kelasBinaan->id,
            'semester_id' => $this->semester->id,
        ]);
        GuruMapelKelas::create([
            'guru_id' => $this->guru->guru->id,
            'mapel_plus_id' => $this->mapelLain->id,
            'kelas_rombel_id' => $this->kelasLain->id,
            'semester_id' => $this->semester->id,
        ]);

        $res = $this->actingAs($this->guru, 'sanctum')
            ->getJson('/api/pengampuan-saya')
            ->assertStatus(200)
            ->assertJsonCount(2);

        $mapelIds = collect($res->json())->pluck('mapel_plus.id')->sort()->values()->all();
        $this->assertEquals([$this->mapelDiampu->id, $this->mapelLain->id], $mapelIds);
    }
}
