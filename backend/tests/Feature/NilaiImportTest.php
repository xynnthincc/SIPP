<?php

namespace Tests\Feature;

use App\Models\Guru;
use App\Models\KelasRombel;
use App\Models\MapelPlus;
use App\Models\NilaiMapel;
use App\Models\Semester;
use App\Models\Siswa;
use App\Models\TahunAjaran;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Hash;
use PhpOffice\PhpSpreadsheet\IOFactory;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use Tests\TestCase;

class NilaiImportTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    private User $wali;

    private User $guru;

    private Semester $semester;

    private KelasRombel $kelas;

    private MapelPlus $mapel;

    private Siswa $siswa;

    protected function setUp(): void
    {
        parent::setUp();

        $this->admin = User::create([
            'name' => 'Admin Tes', 'email' => 'admin-ni@sipp.test',
            'password' => Hash::make('password'), 'role' => User::ROLE_ADMIN,
        ]);
        $this->wali = User::create([
            'name' => 'Wali Tes', 'email' => 'wali-ni@sipp.test',
            'password' => Hash::make('password'), 'role' => User::ROLE_WALI_KELAS,
        ]);
        $this->guru = User::create([
            'name' => 'Guru Tes', 'email' => 'guru-ni@sipp.test',
            'password' => Hash::make('password'), 'role' => User::ROLE_GURU_PESANTREN,
        ]);
        Guru::create(['user_id' => $this->guru->id, 'nama' => 'Guru Tes']);

        $tahun = TahunAjaran::create(['nama' => '2026/2027', 'is_aktif' => true]);
        $this->semester = Semester::create([
            'tahun_ajaran_id' => $tahun->id,
            'nama' => 'Ganjil',
            'jenis' => 'Akhir',
            'is_aktif' => true,
            'penilaian_dibuka' => true,
        ]);
        $this->kelas = KelasRombel::create([
            'nama' => '7A',
            'tingkat' => 7,
            'tahun_ajaran_id' => $tahun->id,
            'wali_kelas_id' => $this->wali->id,
        ]);
        $this->mapel = MapelPlus::create([
            'kode' => 'TAHFIDZ',
            'nama' => 'Tahfidz',
            'kkm_default' => 75,
        ]);
        $this->siswa = Siswa::create([
            'nis' => '999010',
            'nama' => 'Siswa Import',
            'jenis_kelamin' => 'L',
            'kelas_rombel_id' => $this->kelas->id,
        ]);
        NilaiMapel::create([
            'siswa_id' => $this->siswa->id,
            'mapel_plus_id' => $this->mapel->id,
            'semester_id' => $this->semester->id,
            'kkm' => 75,
            'nilai' => 70,
        ]);
    }

    private function unduhTemplate(): string
    {
        $response = $this->actingAs($this->wali, 'sanctum')
            ->get("/api/nilai-diniyah/template?semester_id={$this->semester->id}&kelas_rombel_id={$this->kelas->id}");

        $response->assertOk()
            ->assertHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

        $berkas = tempnam(sys_get_temp_dir(), 'sipp-nilai-');
        file_put_contents($berkas, $response->streamedContent());

        return $berkas;
    }

    public function test_wali_kelas_bisa_unduh_template_nilai(): void
    {
        $berkas = $this->unduhTemplate();
        $sheet = IOFactory::load($berkas)->getActiveSheet();
        unlink($berkas);

        $this->assertSame('Nama Siswa', $sheet->getCell('C5')->getValue());
        $this->assertSame('Tahfidz', $sheet->getCell('D5')->getValue());
        $this->assertSame('__MAPEL_ID__', $sheet->getCell('A4')->getValue());
        $this->assertSame($this->mapel->id, (int) $sheet->getCell('D4')->getValue());
        $this->assertSame('999010', $sheet->getCell('B6')->getValue());
        $this->assertSame(70, $sheet->getCell('D6')->getValue());
    }

    public function test_import_nilai_memperbarui_nilai_siswa(): void
    {
        $berkas = $this->unduhTemplate();
        $spreadsheet = IOFactory::load($berkas);
        $spreadsheet->getActiveSheet()->setCellValue('D6', 95);
        (new Xlsx($spreadsheet))->save($berkas);

        $upload = new UploadedFile(
            $berkas,
            'nilai.xlsx',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            null,
            true
        );

        $response = $this->actingAs($this->wali, 'sanctum')
            ->post('/api/nilai-diniyah/import', [
                'file' => $upload,
                'semester_id' => $this->semester->id,
                'kelas_rombel_id' => $this->kelas->id,
            ]);

        $response->assertOk()
            ->assertJsonPath('ringkasan.nilai_terisi', 1)
            ->assertJsonPath('ringkasan.nilai_kosong', 0);

        $this->assertDatabaseHas('nilai_mapels', [
            'siswa_id' => $this->siswa->id,
            'mapel_plus_id' => $this->mapel->id,
            'semester_id' => $this->semester->id,
            'nilai' => 95,
        ]);

        @unlink($berkas);
    }

    public function test_guru_tanpa_penugasan_tidak_bisa_unduh_template(): void
    {
        $this->actingAs($this->guru, 'sanctum')
            ->get("/api/nilai-diniyah/template?semester_id={$this->semester->id}&kelas_rombel_id={$this->kelas->id}")
            ->assertForbidden();
    }

    public function test_admin_bisa_unduh_template_semua_mapel(): void
    {
        $this->actingAs($this->admin, 'sanctum')
            ->get("/api/nilai-diniyah/template?semester_id={$this->semester->id}&kelas_rombel_id={$this->kelas->id}")
            ->assertOk();
    }
}
