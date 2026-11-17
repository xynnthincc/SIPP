<?php

namespace Tests\Feature;

use App\Models\Guru;
use App\Models\GuruMapelKelas;
use App\Models\JenisAssessment;
use App\Models\KelasRombel;
use App\Models\MapelPlus;
use App\Models\Nilai;
use App\Models\Semester;
use App\Models\Siswa;
use App\Models\TahunAjaran;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

/**
 * Input massal nilai akhir langsung oleh guru mapel (asesmen opsional)
 * dan korelasinya ke rekap wali kelas + rapor cetak.
 */
class NilaiAkhirLangsungTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    private User $wali;

    private User $guru;

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

        $this->wali = User::create([
            'name' => 'Wali Kelas Tes',
            'email' => 'wali-tes@sipp.test',
            'password' => Hash::make('password'),
            'role' => User::ROLE_WALI_KELAS,
        ]);

        $this->guru = User::create([
            'name' => 'Guru Nahwu',
            'email' => 'guru-nahwu@sipp.test',
            'password' => Hash::make('password'),
            'role' => User::ROLE_GURU_PESANTREN,
        ]);
        $guru = Guru::create(['user_id' => $this->guru->id, 'nama' => 'Guru Nahwu']);

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

        $this->siswa = Siswa::create([
            'nis' => '999001',
            'nama' => 'Siswa Tes',
            'jenis_kelamin' => 'L',
            'kelas_rombel_id' => $this->kelas->id,
        ]);

        $this->mapel = MapelPlus::create(['kode' => 'NAHWU', 'nama' => 'Nahwu', 'kkm_default' => 75]);

        GuruMapelKelas::create([
            'guru_id' => $guru->id,
            'mapel_plus_id' => $this->mapel->id,
            'kelas_rombel_id' => $this->kelas->id,
            'semester_id' => $this->semester->id,
        ]);
    }

    public function test_guru_mapel_input_massal_nilai_akhir_langsung(): void
    {
        $this->actingAs($this->guru, 'sanctum')
            ->postJson('/api/nilai-diniyah/massal', [
                'mapel_plus_id' => $this->mapel->id,
                'kelas_rombel_id' => $this->kelas->id,
                'semester_id' => $this->semester->id,
                'nilai' => [['siswa_id' => $this->siswa->id, 'nilai' => 90]],
            ])
            ->assertOk()
            ->assertJson(['message' => 'Nilai akhir berhasil disimpan.']);

        $this->assertDatabaseHas('nilai_mapels', [
            'siswa_id' => $this->siswa->id,
            'mapel_plus_id' => $this->mapel->id,
            'semester_id' => $this->semester->id,
            'kkm' => 75,
            'nilai' => 90,
        ]);

        // GET pendamping mengembalikan nilai tersimpan untuk prefill form
        $daftar = $this->actingAs($this->guru, 'sanctum')
            ->getJson('/api/nilai-diniyah/massal?mapel_plus_id='.$this->mapel->id.'&kelas_rombel_id='.$this->kelas->id.'&semester_id='.$this->semester->id)
            ->assertOk()
            ->json();

        $row = collect($daftar)->firstWhere('siswa_id', $this->siswa->id);
        $this->assertSame(90, $row['nilai']);
        $this->assertSame(75, $row['kkm']);
    }

    public function test_nilai_langsung_guru_tampil_di_rekap_wali_kelas(): void
    {
        $this->actingAs($this->guru, 'sanctum')
            ->postJson('/api/nilai-diniyah/massal', [
                'mapel_plus_id' => $this->mapel->id,
                'kelas_rombel_id' => $this->kelas->id,
                'semester_id' => $this->semester->id,
                'nilai' => [['siswa_id' => $this->siswa->id, 'nilai' => 90]],
            ])->assertOk();

        // Wali kelas membuka rekap input nilai diniyah → nilai Nahwu siswa = 90
        $rekap = $this->actingAs($this->wali, 'sanctum')
            ->getJson('/api/nilai-diniyah/rekap?siswa_id='.$this->siswa->id.'&semester_id='.$this->semester->id)
            ->assertOk()
            ->json();

        $rowNahwu = collect($rekap['mapel'])->firstWhere('id', $this->mapel->id);
        $this->assertSame(90, $rowNahwu['nilai_mapel']['nilai']);
        $this->assertSame(90, $rowNahwu['nilai_akhir']);
    }

    public function test_nilai_langsung_guru_tampil_di_rapor_cetak(): void
    {
        $this->actingAs($this->guru, 'sanctum')
            ->postJson('/api/nilai-diniyah/massal', [
                'mapel_plus_id' => $this->mapel->id,
                'kelas_rombel_id' => $this->kelas->id,
                'semester_id' => $this->semester->id,
                'nilai' => [['siswa_id' => $this->siswa->id, 'nilai' => 90]],
            ])->assertOk();

        $rapor = $this->actingAs($this->wali, 'sanctum')
            ->getJson('/api/rapor/cetak?siswa_id='.$this->siswa->id.'&semester_id='.$this->semester->id)
            ->assertOk()
            ->json();

        $rowNahwu = collect($rapor['mapel'])->firstWhere('nama_id', 'Nahwu');
        $this->assertSame(90, $rowNahwu['nilai']);
    }

    public function test_nilai_langsung_menimpa_perhitungan_asesmen(): void
    {
        // Ada nilai asesmen (agregasi = 80)…
        $jenis = JenisAssessment::create([
            'mapel_plus_id' => $this->mapel->id,
            'nama' => 'Ulangan Harian',
            'kategori' => 'sumatif',
            'bobot' => 100,
        ]);
        Nilai::create([
            'siswa_id' => $this->siswa->id,
            'jenis_assessment_id' => $jenis->id,
            'semester_id' => $this->semester->id,
            'nilai' => 80,
            'dicatat_oleh' => $this->guru->id,
        ]);

        // …lalu guru menetapkan nilai akhir langsung 90 → 90 yang dipakai
        $this->actingAs($this->guru, 'sanctum')
            ->postJson('/api/nilai-diniyah/massal', [
                'mapel_plus_id' => $this->mapel->id,
                'kelas_rombel_id' => $this->kelas->id,
                'semester_id' => $this->semester->id,
                'nilai' => [['siswa_id' => $this->siswa->id, 'nilai' => 90]],
            ])->assertOk();

        $rekap = $this->actingAs($this->wali, 'sanctum')
            ->getJson('/api/nilai-diniyah/rekap?siswa_id='.$this->siswa->id.'&semester_id='.$this->semester->id)
            ->assertOk()
            ->json();

        $rowNahwu = collect($rekap['mapel'])->firstWhere('id', $this->mapel->id);
        $this->assertSame(90, $rowNahwu['nilai_akhir']);
    }

    public function test_kosongkan_nilai_langsung_kembali_ke_perhitungan_asesmen(): void
    {
        $jenis = JenisAssessment::create([
            'mapel_plus_id' => $this->mapel->id,
            'nama' => 'Ulangan Harian',
            'kategori' => 'sumatif',
            'bobot' => 100,
        ]);
        Nilai::create([
            'siswa_id' => $this->siswa->id,
            'jenis_assessment_id' => $jenis->id,
            'semester_id' => $this->semester->id,
            'nilai' => 80,
            'dicatat_oleh' => $this->guru->id,
        ]);

        // Set langsung 90, lalu dikosongkan (null) → kembali ke agregat 80
        $this->actingAs($this->guru, 'sanctum')
            ->postJson('/api/nilai-diniyah/massal', [
                'mapel_plus_id' => $this->mapel->id,
                'kelas_rombel_id' => $this->kelas->id,
                'semester_id' => $this->semester->id,
                'nilai' => [['siswa_id' => $this->siswa->id, 'nilai' => 90]],
            ])->assertOk();

        $this->actingAs($this->guru, 'sanctum')
            ->postJson('/api/nilai-diniyah/massal', [
                'mapel_plus_id' => $this->mapel->id,
                'kelas_rombel_id' => $this->kelas->id,
                'semester_id' => $this->semester->id,
                'nilai' => [['siswa_id' => $this->siswa->id, 'nilai' => null]],
            ])->assertOk();

        $rekap = $this->actingAs($this->wali, 'sanctum')
            ->getJson('/api/nilai-diniyah/rekap?siswa_id='.$this->siswa->id.'&semester_id='.$this->semester->id)
            ->assertOk()
            ->json();

        $rowNahwu = collect($rekap['mapel'])->firstWhere('id', $this->mapel->id);
        $this->assertNull($rowNahwu['nilai_mapel']['nilai']);
        $this->assertSame(80, $rowNahwu['nilai_akhir']);
    }

    public function test_guru_tanpa_pengampuan_ditolak(): void
    {
        $guruLain = User::create([
            'name' => 'Guru Lain',
            'email' => 'guru-lain@sipp.test',
            'password' => Hash::make('password'),
            'role' => User::ROLE_GURU_PESANTREN,
        ]);
        Guru::create(['user_id' => $guruLain->id, 'nama' => 'Guru Lain']);

        $this->actingAs($guruLain, 'sanctum')
            ->postJson('/api/nilai-diniyah/massal', [
                'mapel_plus_id' => $this->mapel->id,
                'kelas_rombel_id' => $this->kelas->id,
                'semester_id' => $this->semester->id,
                'nilai' => [['siswa_id' => $this->siswa->id, 'nilai' => 90]],
            ])
            ->assertForbidden();
    }

    public function test_siswa_luar_kelas_ditolak(): void
    {
        $siswaLuar = Siswa::create([
            'nis' => '999099',
            'nama' => 'Siswa Luar',
            'jenis_kelamin' => 'L',
        ]);

        $this->actingAs($this->guru, 'sanctum')
            ->postJson('/api/nilai-diniyah/massal', [
                'mapel_plus_id' => $this->mapel->id,
                'kelas_rombel_id' => $this->kelas->id,
                'semester_id' => $this->semester->id,
                'nilai' => [['siswa_id' => $siswaLuar->id, 'nilai' => 90]],
            ])
            ->assertStatus(422);
    }

    public function test_wali_kelas_lain_ditolak(): void
    {
        $waliLain = User::create([
            'name' => 'Wali Lain',
            'email' => 'wali-lain@sipp.test',
            'password' => Hash::make('password'),
            'role' => User::ROLE_WALI_KELAS,
        ]);

        $this->actingAs($waliLain, 'sanctum')
            ->postJson('/api/nilai-diniyah/massal', [
                'mapel_plus_id' => $this->mapel->id,
                'kelas_rombel_id' => $this->kelas->id,
                'semester_id' => $this->semester->id,
                'nilai' => [['siswa_id' => $this->siswa->id, 'nilai' => 90]],
            ])
            ->assertForbidden();
    }

    public function test_penilaian_ditutup_ditolak(): void
    {
        $this->semester->update(['penilaian_dibuka' => false]);

        $this->actingAs($this->guru, 'sanctum')
            ->postJson('/api/nilai-diniyah/massal', [
                'mapel_plus_id' => $this->mapel->id,
                'kelas_rombel_id' => $this->kelas->id,
                'semester_id' => $this->semester->id,
                'nilai' => [['siswa_id' => $this->siswa->id, 'nilai' => 90]],
            ])
            ->assertStatus(422);
    }
}
