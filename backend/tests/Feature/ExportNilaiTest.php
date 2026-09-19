<?php

namespace Tests\Feature;

use App\Models\Guru;
use App\Models\GuruMapelKelas;
use App\Models\JenisAssessment;
use App\Models\KelasRombel;
use App\Models\MapelPlus;
use App\Models\NilaiMapel;
use App\Models\Semester;
use App\Models\Siswa;
use App\Models\TahunAjaran;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use PhpOffice\PhpSpreadsheet\IOFactory;
use Tests\TestCase;

class ExportNilaiTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    private User $wali;

    private User $guru;

    private Semester $semester;

    private KelasRombel $kelas;

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
        $guru = Guru::create(['user_id' => $this->guru->id, 'nama' => 'Guru Ujian']);

        $tahun = TahunAjaran::create(['nama' => '2026/2027', 'is_aktif' => true]);
        $this->semester = Semester::create([
            'tahun_ajaran_id' => $tahun->id,
            'nama' => 'Ganjil',
            'is_aktif' => true,
            'penilaian_dibuka' => true,
        ]);

        $this->kelas = KelasRombel::create([
            'nama' => '7A',
            'tingkat' => 7,
            'tahun_ajaran_id' => $tahun->id,
            'wali_kelas_id' => $this->wali->id,
        ]);

        $this->mapel = MapelPlus::create(['kode' => 'TAHFIDZ', 'nama' => 'Tahfidz', 'kkm_default' => 75]);

        GuruMapelKelas::create([
            'guru_id' => $guru->id,
            'mapel_plus_id' => $this->mapel->id,
            'kelas_rombel_id' => $this->kelas->id,
            'semester_id' => $this->semester->id,
        ]);
    }

    private function buatSiswa(string $nis, string $nama, ?int $nilai): Siswa
    {
        $siswa = Siswa::create([
            'nis' => $nis,
            'nama' => $nama,
            'jenis_kelamin' => 'L',
            'kelas_rombel_id' => $this->kelas->id,
        ]);

        if ($nilai !== null) {
            NilaiMapel::create([
                'siswa_id' => $siswa->id,
                'mapel_plus_id' => $this->mapel->id,
                'semester_id' => $this->semester->id,
                'kkm' => 75,
                'nilai' => $nilai,
            ]);
        }

        return $siswa;
    }

    public function test_wali_kelas_export_kelasnya_sendiri(): void
    {
        $tinggi = $this->buatSiswa('999010', 'Siswa Tinggi', 90);
        $rendah = $this->buatSiswa('999011', 'Siswa Rendah', 60);

        $response = $this->actingAs($this->wali, 'sanctum')
            ->getJson("/api/nilai-diniyah/export?semester_id={$this->semester->id}");

        $response->assertOk()
            ->assertHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

        $namaFile = $response->headers->get('Content-Disposition');
        $this->assertStringContainsString('Nilai_7A_SemesterGanjil', $namaFile);

        // Baca kembali xlsx-nya: urutan harus ranking terbaik di atas
        $berkas = tempnam(sys_get_temp_dir(), 'sipp-test-');
        file_put_contents($berkas, $response->streamedContent());
        $sheet = IOFactory::load($berkas)->getActiveSheet();
        unlink($berkas);

        $this->assertSame('Siswa Tinggi', $sheet->getCell('C5')->getValue());
        $this->assertSame('Siswa Rendah', $sheet->getCell('C6')->getValue());
        $this->assertSame(1, $sheet->getCell('A5')->getValue());
        $this->assertSame(2, $sheet->getCell('A6')->getValue());
        $this->assertSame(90, $sheet->getCell('D5')->getValue());
        $this->assertSame(90, $sheet->getCell('E5')->getValue()); // total
        $this->assertEquals(90.0, $sheet->getCell('F5')->getValue()); // rata-rata (round → float)
        $this->assertSame($tinggi->id, Siswa::where('nis', '999010')->first()->id);
    }

    public function test_export_ranking_sama_untuk_total_sama(): void
    {
        $this->buatSiswa('999010', 'Siswa A', 80);
        $this->buatSiswa('999011', 'Siswa B', 80);

        $response = $this->actingAs($this->wali, 'sanctum')
            ->getJson("/api/nilai-diniyah/export?semester_id={$this->semester->id}");

        $response->assertOk();

        $berkas = tempnam(sys_get_temp_dir(), 'sipp-test-');
        file_put_contents($berkas, $response->streamedContent());
        $sheet = IOFactory::load($berkas)->getActiveSheet();
        unlink($berkas);

        // Total sama → ranking sama (1 dan 1)
        $this->assertSame(1, $sheet->getCell('G5')->getValue());
        $this->assertSame(1, $sheet->getCell('G6')->getValue());
    }

    public function test_guru_tidak_boleh_export(): void
    {
        $this->actingAs($this->guru, 'sanctum')
            ->getJson("/api/nilai-diniyah/export?semester_id={$this->semester->id}")
            ->assertForbidden();
    }

    public function test_admin_export_wajib_pilih_kelas(): void
    {
        $this->actingAs($this->admin, 'sanctum')
            ->getJson("/api/nilai-diniyah/export?semester_id={$this->semester->id}")
            ->assertStatus(422);

        $this->actingAs($this->admin, 'sanctum')
            ->getJson("/api/nilai-diniyah/export?semester_id={$this->semester->id}&kelas_rombel_id={$this->kelas->id}")
            ->assertOk();
    }

    public function test_guru_bisa_input_nilai_massal_di_kelas_diampunya(): void
    {
        $siswa = $this->buatSiswa('999010', 'Siswa A', null);
        $jenis = JenisAssessment::create([
            'mapel_plus_id' => $this->mapel->id,
            'nama' => 'Ulangan Harian',
            'kategori' => 'sumatif',
            'bobot' => 100,
        ]);

        $this->actingAs($this->guru, 'sanctum')
            ->postJson('/api/nilai/massal', [
                'jenis_assessment_id' => $jenis->id,
                'semester_id' => $this->semester->id,
                'nilai' => [['siswa_id' => $siswa->id, 'nilai' => 88]],
            ])
            ->assertOk();

        $this->assertDatabaseHas('nilais', [
            'siswa_id' => $siswa->id,
            'jenis_assessment_id' => $jenis->id,
            'nilai' => 88,
        ]);
    }

    public function test_guru_ditolak_input_nilai_siswa_di_luar_kelas_diampunya(): void
    {
        $kelasLain = KelasRombel::create([
            'nama' => '7B',
            'tingkat' => 7,
            'tahun_ajaran_id' => $this->semester->tahun_ajaran_id,
        ]);
        $siswaLain = Siswa::create([
            'nis' => '999099',
            'nama' => 'Siswa Kelas Lain',
            'jenis_kelamin' => 'L',
            'kelas_rombel_id' => $kelasLain->id,
        ]);
        $jenis = JenisAssessment::create([
            'mapel_plus_id' => $this->mapel->id,
            'nama' => 'Ulangan Harian',
            'kategori' => 'sumatif',
            'bobot' => 100,
        ]);

        $this->actingAs($this->guru, 'sanctum')
            ->postJson('/api/nilai/massal', [
                'jenis_assessment_id' => $jenis->id,
                'semester_id' => $this->semester->id,
                'nilai' => [['siswa_id' => $siswaLain->id, 'nilai' => 88]],
            ])
            ->assertForbidden();
    }
}
