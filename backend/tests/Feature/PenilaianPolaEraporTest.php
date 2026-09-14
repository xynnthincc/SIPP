<?php

namespace Tests\Feature;

use App\Models\DeskripsiCapaian;
use App\Models\JenisAssessment;
use App\Models\KelasRombel;
use App\Models\MapelPlus;
use App\Models\Nilai;
use App\Models\PredikatRange;
use App\Models\Rapor;
use App\Models\Semester;
use App\Models\Siswa;
use App\Models\TahunAjaran;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class PenilaianPolaEraporTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    private User $waliKelas;

    private User $waliKelasLain;

    private Siswa $siswa;

    private Semester $semester;

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

        $this->waliKelas = User::create([
            'name' => 'Wali Kelas Tes',
            'email' => 'wali-tes@sipp.test',
            'password' => Hash::make('password'),
            'role' => User::ROLE_WALI_KELAS,
        ]);

        $this->waliKelasLain = User::create([
            'name' => 'Wali Lain Tes',
            'email' => 'wali-lain@sipp.test',
            'password' => Hash::make('password'),
            'role' => User::ROLE_WALI_KELAS,
        ]);

        $tahun = TahunAjaran::create(['nama' => '2026/2027', 'is_aktif' => true]);
        $this->semester = Semester::create([
            'tahun_ajaran_id' => $tahun->id,
            'nama' => 'Ganjil',
            'is_aktif' => true,
            'penilaian_dibuka' => true,
        ]);

        $kelas = KelasRombel::create([
            'nama' => 'VII-A',
            'tingkat' => 7,
            'wali_kelas_id' => $this->waliKelas->id,
            'tahun_ajaran_id' => $tahun->id,
        ]);

        $this->siswa = Siswa::create([
            'nis' => '999001',
            'nama' => 'Siswa Tes',
            'jenis_kelamin' => 'L',
            'kelas_rombel_id' => $kelas->id,
        ]);

        $this->mapel = MapelPlus::create([
            'kode' => 'TES_TAHFIDZ',
            'nama' => 'Tahfidz Tes',
            'punya_progres_hafalan' => true,
        ]);
    }

    public function test_rekap_hanya_menghitung_sumatif_dan_konversi_predikat(): void
    {
        $uts = JenisAssessment::create([
            'mapel_plus_id' => $this->mapel->id,
            'nama' => 'Ujian Tengah Semester',
            'kategori' => 'sumatif',
            'bobot' => 60,
        ]);
        $uas = JenisAssessment::create([
            'mapel_plus_id' => $this->mapel->id,
            'nama' => 'Ujian Akhir Semester',
            'kategori' => 'sumatif',
            'bobot' => 40,
        ]);
        $latihan = JenisAssessment::create([
            'mapel_plus_id' => $this->mapel->id,
            'nama' => 'Latihan Harian',
            'kategori' => 'formatif',
            'bobot' => 100,
        ]);

        Nilai::create(['siswa_id' => $this->siswa->id, 'jenis_assessment_id' => $uts->id, 'semester_id' => $this->semester->id, 'nilai' => 80, 'dicatat_oleh' => $this->admin->id]);
        Nilai::create(['siswa_id' => $this->siswa->id, 'jenis_assessment_id' => $uas->id, 'semester_id' => $this->semester->id, 'nilai' => 90, 'dicatat_oleh' => $this->admin->id]);
        // Nilai formatif tinggi tidak boleh mempengaruhi nilai akhir
        Nilai::create(['siswa_id' => $this->siswa->id, 'jenis_assessment_id' => $latihan->id, 'semester_id' => $this->semester->id, 'nilai' => 100, 'dicatat_oleh' => $this->admin->id]);

        PredikatRange::create(['nama' => 'Sangat Baik', 'nilai_min' => 86, 'nilai_max' => 100]);
        PredikatRange::create(['nama' => 'Baik', 'nilai_min' => 71, 'nilai_max' => 85.99]);

        $response = $this->actingAs($this->admin, 'sanctum')
            ->getJson("/api/siswas/{$this->siswa->id}/nilai-rekap/{$this->semester->id}");

        $response->assertStatus(200)
            ->assertJsonPath('0.mapel', 'Tahfidz Tes')
            // (80*60 + 90*40) / 100 = 84 — formatif 100 dikecualikan
            ->assertJsonPath('0.predikat', 'Baik')
            ->assertJsonCount(3, '0.rincian');
        $this->assertEquals(84, $response->json('0.nilai_akhir'));
    }

    public function test_rapor_ditolak_bisa_diajukan_ulang(): void
    {
        $rapor = Rapor::create([
            'siswa_id' => $this->siswa->id,
            'semester_id' => $this->semester->id,
            'status' => Rapor::STATUS_DITOLAK,
            'disusun_oleh' => $this->waliKelas->id,
        ]);

        $response = $this->actingAs($this->waliKelas, 'sanctum')
            ->postJson("/api/rapors/{$rapor->id}/ajukan", ['catatan_wali_kelas' => 'Sudah diperbaiki.']);

        $response->assertStatus(200);
        $this->assertSame(Rapor::STATUS_DIAJUKAN, $rapor->fresh()->status);
    }

    public function test_wali_kelas_lain_tidak_bisa_mengelola_siswa_bukan_binaannya(): void
    {
        $response = $this->actingAs($this->waliKelasLain, 'sanctum')
            ->postJson('/api/deskripsi-capaian', [
                'siswa_id' => $this->siswa->id,
                'mapel_plus_id' => $this->mapel->id,
                'semester_id' => $this->semester->id,
                'deskripsi' => 'Pencapaian sangat baik.',
            ]);

        $response->assertStatus(403);
    }

    public function test_deskripsi_capaian_upsert_per_mapel(): void
    {
        $payload = [
            'siswa_id' => $this->siswa->id,
            'mapel_plus_id' => $this->mapel->id,
            'semester_id' => $this->semester->id,
        ];

        $this->actingAs($this->waliKelas, 'sanctum')
            ->postJson('/api/deskripsi-capaian', [...$payload, 'deskripsi' => 'Awal'])
            ->assertStatus(201);

        $this->actingAs($this->waliKelas, 'sanctum')
            ->postJson('/api/deskripsi-capaian', [...$payload, 'deskripsi' => 'Revisi'])
            ->assertStatus(200);

        $this->assertSame(1, DeskripsiCapaian::count());
        $this->assertSame('Revisi', DeskripsiCapaian::first()->deskripsi);
    }

    public function test_predikat_range_hanya_dikelola_admin(): void
    {
        $this->actingAs($this->waliKelas, 'sanctum')
            ->postJson('/api/predikat-range', ['nama' => 'Baik', 'nilai_min' => 70, 'nilai_max' => 85])
            ->assertStatus(403);

        $this->actingAs($this->admin, 'sanctum')
            ->postJson('/api/predikat-range', ['nama' => 'Baik', 'nilai_min' => 70, 'nilai_max' => 85])
            ->assertStatus(201);

        $this->actingAs($this->admin, 'sanctum')
            ->postJson('/api/predikat-range', ['nama' => 'Salah', 'nilai_min' => 90, 'nilai_max' => 20])
            ->assertStatus(422);
    }
}
