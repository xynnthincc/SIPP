<?php

namespace Tests\Feature;

use App\Models\KelasRombel;
use App\Models\Semester;
use App\Models\Siswa;
use App\Models\TahunAjaran;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class RaporPdfTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    private User $guru;

    private Siswa $siswa;

    private int $semesterId;

    protected function setUp(): void
    {
        parent::setUp();

        $this->admin = User::create(['name' => 'Admin Tes', 'email' => 'admin-pdf@sipp.test', 'password' => Hash::make('password'), 'role' => User::ROLE_ADMIN]);

        $this->guru = User::create(['name' => 'Guru Ujian', 'email' => 'guru-pdf@sipp.test', 'password' => Hash::make('password'), 'role' => User::ROLE_GURU_PESANTREN]);

        $tahun = TahunAjaran::create(['nama' => '2026/2027', 'is_aktif' => true]);
        $semester = Semester::create(['tahun_ajaran_id' => $tahun->id, 'nama' => 'Ganjil', 'is_aktif' => true, 'penilaian_dibuka' => true]);
        $kelas = KelasRombel::create(['nama' => 'Qitsmu Awwal', 'tingkat' => 1, 'tahun_ajaran_id' => $tahun->id]);

        $this->siswa = Siswa::create(['nis' => '958001', 'nama' => 'Santri PDF', 'jenis_kelamin' => 'L', 'kelas_rombel_id' => $kelas->id]);

        $this->semesterId = $semester->id;
    }

    public function test_admin_mendapat_html_rapor_dengan_driver_default(): void
    {
        $this->actingAs($this->admin, 'sanctum')
            ->getJson("/api/rapor/pdf?siswa_id={$this->siswa->id}&semester_id={$this->semesterId}")
            ->assertOk()
            ->assertHeader('Content-Type', 'text/html; charset=UTF-8')
            ->assertSee('Laporan Hasil Belajar')
            ->assertSee('Santri PDF');
    }

    public function test_driver_tidak_dikenal_jatuh_ke_html(): void
    {
        config(['services.rapor.pdf_driver' => 'chrome']);

        $this->actingAs($this->admin, 'sanctum')
            ->getJson("/api/rapor/pdf?siswa_id={$this->siswa->id}&semester_id={$this->semesterId}")
            ->assertOk()
            ->assertHeader('Content-Type', 'text/html; charset=UTF-8');
    }

    public function test_guru_pesantren_ditolak_mencetak(): void
    {
        $this->actingAs($this->guru, 'sanctum')
            ->getJson("/api/rapor/pdf?siswa_id={$this->siswa->id}&semester_id={$this->semesterId}")
            ->assertForbidden();
    }
}
