<?php

namespace Tests\Feature;

use App\Models\KelasRombel;
use App\Models\Siswa;
use App\Models\TahunAjaran;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use PhpOffice\PhpSpreadsheet\IOFactory;
use Tests\TestCase;

class SiswaTemplateTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    private User $guru;

    private KelasRombel $kelas;

    private Siswa $siswa;

    protected function setUp(): void
    {
        parent::setUp();

        $this->admin = User::create([
            'name' => 'Admin Tes', 'email' => 'admin-st@sipp.test',
            'password' => Hash::make('password'), 'role' => User::ROLE_ADMIN,
        ]);
        $this->guru = User::create([
            'name' => 'Guru Tes', 'email' => 'guru-st@sipp.test',
            'password' => Hash::make('password'), 'role' => User::ROLE_GURU_PESANTREN,
        ]);

        $tahun = TahunAjaran::create(['nama' => '2026/2027', 'is_aktif' => true]);
        $this->kelas = KelasRombel::create([
            'nama' => '7A',
            'tingkat' => 7,
            'tahun_ajaran_id' => $tahun->id,
        ]);
        $this->siswa = Siswa::create([
            'nis' => '999010',
            'nama' => 'Siswa Template',
            'jenis_kelamin' => 'L',
            'kelas_rombel_id' => $this->kelas->id,
            'nama_ayah' => 'Ayah Contoh',
            'agama' => 'Islam',
        ]);
    }

    public function test_admin_bisa_unduh_template_siswa(): void
    {
        $response = $this->actingAs($this->admin, 'sanctum')->get('/api/siswa/template');

        $response->assertOk()
            ->assertHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

        $berkas = tempnam(sys_get_temp_dir(), 'sipp-siswa-');
        file_put_contents($berkas, $response->streamedContent());
        $spreadsheet = IOFactory::load($berkas);
        unlink($berkas);

        $this->assertNotNull($spreadsheet->getSheetByName('Semua Siswa'));
        $this->assertNotNull($spreadsheet->getSheetByName('Petunjuk'));

        $sheet = $spreadsheet->getSheetByName('Semua Siswa');
        $this->assertSame('Nama', $sheet->getCell('B5')->getValue());
        $this->assertSame('NIPD', $sheet->getCell('C5')->getValue());
        $this->assertSame('Siswa Template', $sheet->getCell('B7')->getValue());
        $this->assertSame('999010', $sheet->getCell('C7')->getValue());
        $this->assertSame('7A', $sheet->getCell('AQ7')->getValue());
        $this->assertSame('Ayah Contoh', $sheet->getCell('Y7')->getValue());
    }

    public function test_non_admin_tidak_bisa_unduh_template_siswa(): void
    {
        $this->actingAs($this->guru, 'sanctum')
            ->get('/api/siswa/template')
            ->assertForbidden();
    }
}
