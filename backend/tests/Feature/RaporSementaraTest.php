<?php

namespace Tests\Feature;

use App\Models\KelasRombel;
use App\Models\MapelPlus;
use App\Models\Semester;
use App\Models\Siswa;
use App\Models\TahunAjaran;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class RaporSementaraTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    private User $wali;

    private Semester $semesterAkhir;

    private Siswa $siswa;

    private MapelPlus $mapel;

    protected function setUp(): void
    {
        parent::setUp();

        $this->admin = User::create([
            'name' => 'Admin Tes',
            'email' => 'admin-sementara@sipp.test',
            'password' => Hash::make('password'),
            'role' => User::ROLE_ADMIN,
        ]);
        $this->wali = User::create([
            'name' => 'Wali Kelas Tes',
            'email' => 'wali-sementara@sipp.test',
            'password' => Hash::make('password'),
            'role' => User::ROLE_WALI_KELAS,
        ]);

        $tahun = TahunAjaran::create(['nama' => '2026/2027', 'is_aktif' => true]);
        $this->semesterAkhir = Semester::create([
            'tahun_ajaran_id' => $tahun->id,
            'nama' => 'Ganjil',
            'jenis' => 'Akhir',
            'is_aktif' => true,
            'penilaian_dibuka' => true,
        ]);
        $kelas = KelasRombel::create([
            'nama' => 'VII-A',
            'tingkat' => 7,
            'tahun_ajaran_id' => $tahun->id,
            'wali_kelas_id' => $this->wali->id,
        ]);
        $this->siswa = Siswa::create([
            'nis' => '997001',
            'nama' => 'Siswa Sementara',
            'jenis_kelamin' => 'L',
            'kelas_rombel_id' => $kelas->id,
        ]);
        $this->mapel = MapelPlus::create(['kode' => 'TAHFIDZ', 'nama' => 'Tahfidz', 'kkm_default' => 75]);
    }

    private function buatSemesterSementara(): Semester
    {
        return Semester::create([
            'tahun_ajaran_id' => $this->semesterAkhir->tahun_ajaran_id,
            'nama' => 'Ganjil',
            'jenis' => 'Sementara',
            'is_aktif' => false,
            'penilaian_dibuka' => true,
        ]);
    }

    public function test_admin_bisa_membuat_wadah_semester_sementara_berdampingan_dengan_akhir(): void
    {
        $this->actingAs($this->admin, 'sanctum')
            ->postJson('/api/semester', [
                'tahun_ajaran_id' => $this->semesterAkhir->tahun_ajaran_id,
                'nama' => 'Ganjil',
                'jenis' => 'Sementara',
            ])
            ->assertStatus(201)
            ->assertJsonPath('jenis', 'Sementara');

        $this->assertDatabaseHas('semesters', [
            'tahun_ajaran_id' => $this->semesterAkhir->tahun_ajaran_id,
            'nama' => 'Ganjil',
            'jenis' => 'Sementara',
        ]);

        // Duplikat kombinasi nama+jenis dalam satu tahun ajaran ditolak
        $this->actingAs($this->admin, 'sanctum')
            ->postJson('/api/semester', [
                'tahun_ajaran_id' => $this->semesterAkhir->tahun_ajaran_id,
                'nama' => 'Ganjil',
                'jenis' => 'Sementara',
            ])
            ->assertStatus(422);
    }

    public function test_ubah_jenis_semester_ke_kombinasi_yang_sudah_ada_ditolak(): void
    {
        $sementara = $this->buatSemesterSementara();

        $this->actingAs($this->admin, 'sanctum')
            ->putJson("/api/semester/{$sementara->id}", ['jenis' => 'Akhir'])
            ->assertStatus(422);
    }

    public function test_nilai_rapor_sementara_terpisah_dari_semester_akhir(): void
    {
        $sementara = $this->buatSemesterSementara();

        // Nilai hanya diinput pada wadah Akhir
        $this->actingAs($this->wali, 'sanctum')
            ->postJson('/api/nilai-diniyah/simpan', [
                'siswa_id' => $this->siswa->id,
                'semester_id' => $this->semesterAkhir->id,
                'nilai_mapel' => [['mapel_plus_id' => $this->mapel->id, 'kkm' => 75, 'nilai' => 85]],
            ]);

        // Rapor sementara: jenis tercantum, nilai kosong (wadah berisi input terpisah)
        $this->actingAs($this->admin, 'sanctum')
            ->getJson('/api/rapor/cetak?siswa_id='.$this->siswa->id.'&semester_id='.$sementara->id)
            ->assertStatus(200)
            ->assertJsonPath('semester.jenis', 'Sementara')
            ->assertJsonPath('semester.nama', 'Ganjil')
            ->assertJsonPath('mapel.0.nilai', null);

        // Rapor akhir: nilai dari wadah Akhir tetap terbaca
        $this->actingAs($this->admin, 'sanctum')
            ->getJson('/api/rapor/cetak?siswa_id='.$this->siswa->id.'&semester_id='.$this->semesterAkhir->id)
            ->assertStatus(200)
            ->assertJsonPath('semester.jenis', 'Akhir')
            ->assertJsonPath('mapel.0.nilai', 85);
    }

    public function test_pdf_rapor_sementara_menandai_judul_dan_semester(): void
    {
        $sementara = $this->buatSemesterSementara();

        $this->actingAs($this->admin, 'sanctum')
            ->getJson("/api/rapor/pdf?siswa_id={$this->siswa->id}&semester_id={$sementara->id}")
            ->assertOk()
            ->assertHeader('Content-Type', 'text/html; charset=UTF-8')
            ->assertSee('Laporan Hasil Belajar — SEMENTARA')
            ->assertSee('Ganjil (Sementara)');
    }
}
