<?php

namespace Tests\Feature;

use App\Models\Guru;
use App\Models\GuruMapelKelas;
use App\Models\KelasRombel;
use App\Models\MapelPlus;
use App\Models\NilaiMapel;
use App\Models\NilaiPraktik;
use App\Models\PraktikItem;
use App\Models\ProgresHafalan;
use App\Models\Semester;
use App\Models\Siswa;
use App\Models\TahunAjaran;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

/**
 * Revisi nilai bisa desimal (integer → float) dan catat progres hafalan
 * bisa dikoreksi/dihapus (update & destroy, dibatasi perekam/admin).
 */
class DesimalDanHafalanTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    private User $wali;

    private User $guru;

    private User $guruLain;

    private Semester $semester;

    private KelasRombel $kelas;

    private Siswa $siswa;

    private MapelPlus $mapel;

    private PraktikItem $praktikItem;

    private ProgresHafalan $setoran;

    protected function setUp(): void
    {
        parent::setUp();

        $this->admin = User::create([
            'name' => 'Admin Tes', 'email' => 'admin-deci@sipp.test',
            'password' => Hash::make('password'), 'role' => User::ROLE_ADMIN,
        ]);
        $this->wali = User::create([
            'name' => 'Wali Kelas Tes', 'email' => 'wali-deci@sipp.test',
            'password' => Hash::make('password'), 'role' => User::ROLE_WALI_KELAS,
        ]);
        $this->guru = User::create([
            'name' => 'Guru Nahwu', 'email' => 'guru-deci@sipp.test',
            'password' => Hash::make('password'), 'role' => User::ROLE_GURU_PESANTREN,
        ]);
        $guru = Guru::create(['user_id' => $this->guru->id, 'nama' => 'Guru Nahwu']);

        $this->guruLain = User::create([
            'name' => 'Guru Fiqih', 'email' => 'guru-lain@sipp.test',
            'password' => Hash::make('password'), 'role' => User::ROLE_GURU_PESANTREN,
        ]);
        $guruLain = Guru::create(['user_id' => $this->guruLain->id, 'nama' => 'Guru Fiqih']);

        $tahun = TahunAjaran::create(['nama' => '2026/2027', 'is_aktif' => true]);
        $this->semester = Semester::create([
            'tahun_ajaran_id' => $tahun->id, 'nama' => 'Ganjil',
            'is_aktif' => true, 'penilaian_dibuka' => true,
        ]);

        $this->kelas = KelasRombel::create([
            'nama' => '7A', 'tingkat' => 7,
            'tahun_ajaran_id' => $tahun->id, 'wali_kelas_id' => $this->wali->id,
        ]);

        $this->siswa = Siswa::create([
            'nis' => '999001', 'nama' => 'Siswa Tes',
            'jenis_kelamin' => 'L', 'kelas_rombel_id' => $this->kelas->id,
        ]);

        $this->mapel = MapelPlus::create(['kode' => 'NAHWU', 'nama' => 'Nahwu', 'kkm_default' => 75]);
        $this->praktikItem = PraktikItem::create(['kode' => 'SHOLAT', 'nama_id' => 'Sholat Jamaah', 'urutan' => 1]);

        GuruMapelKelas::create([
            'guru_id' => $guru->id, 'mapel_plus_id' => $this->mapel->id,
            'kelas_rombel_id' => $this->kelas->id, 'semester_id' => $this->semester->id,
        ]);

        $this->setoran = ProgresHafalan::create([
            'siswa_id' => $this->siswa->id,
            'mapel_plus_id' => $this->mapel->id,
            'tanggal_setoran' => '2026-09-21',
            'materi' => 'Juz 30 - An-Naba',
            'status' => 'Lancar',
            'dicatat_oleh' => $this->guru->id,
        ]);
    }

    public function test_guru_input_massal_nilai_desimal(): void
    {
        $this->actingAs($this->guru, 'sanctum')
            ->postJson('/api/nilai-diniyah/massal', [
                'mapel_plus_id' => $this->mapel->id,
                'kelas_rombel_id' => $this->kelas->id,
                'semester_id' => $this->semester->id,
                'nilai' => [['siswa_id' => $this->siswa->id, 'nilai' => 85.5]],
            ])
            ->assertStatus(200);

        $this->assertDatabaseHas('nilai_mapels', [
            'siswa_id' => $this->siswa->id, 'mapel_plus_id' => $this->mapel->id,
        ]);

        $this->assertStringStartsWith('85.5', (string) NilaiMapel::where('siswa_id', $this->siswa->id)->value('nilai'));

        // Raport memakai nilai desimal apa adanya (total & rata-rata)
        $this->actingAs($this->admin, 'sanctum')
            ->getJson('/api/rapor/cetak?siswa_id='.$this->siswa->id.'&semester_id='.$this->semester->id)
            ->assertStatus(200)
            ->assertJsonPath('mapel.0.nilai', 85.5)
            ->assertJsonPath('total', 85.5);
    }

    public function test_praktik_diterima_desimal_lewat_simpan_wali(): void
    {
        $this->actingAs($this->wali, 'sanctum')
            ->postJson('/api/nilai-diniyah/simpan', [
                'siswa_id' => $this->siswa->id,
                'semester_id' => $this->semester->id,
                'nilai_praktik' => [
                    ['praktik_item_id' => $this->praktikItem->id, 'nilai' => 88.25, 'keterangan' => 'Istimewa'],
                ],
            ])
            ->assertStatus(200);

        $this->assertStringStartsWith('88.25', (string) NilaiPraktik::where('siswa_id', $this->siswa->id)->value('nilai'));
    }

    public function test_perekam_bisa_mengoreksi_setoran_hafalan(): void
    {
        $this->actingAs($this->guru, 'sanctum')
            ->putJson('/api/progres-hafalan/'.$this->setoran->id, [
                'materi' => 'Juz 30 - An-Naziat',
                'status' => 'Perlu Perbaikan',
            ])
            ->assertStatus(200)
            ->assertJsonPath('materi', 'Juz 30 - An-Naziat')
            ->assertJsonPath('status', 'Perlu Perbaikan')
            ->assertJsonPath('siswa_id', $this->siswa->id);

        $this->assertDatabaseHas('progres_hafalans', [
            'id' => $this->setoran->id, 'materi' => 'Juz 30 - An-Naziat',
        ]);
    }

    public function test_guru_lain_dilarang_mengoreksi_setoran(): void
    {
        $this->actingAs($this->guruLain, 'sanctum')
            ->putJson('/api/progres-hafalan/'.$this->setoran->id, [
                'materi' => 'Materi Orang Lain',
            ])
            ->assertStatus(403);
    }

    public function test_admin_bisa_mengoreksi_setoran(): void
    {
        $this->actingAs($this->admin, 'sanctum')
            ->putJson('/api/progres-hafalan/'.$this->setoran->id, [
                'catatan' => 'Diedit admin karena typo.',
            ])
            ->assertStatus(200)
            ->assertJsonPath('catatan', 'Diedit admin karena typo.');
    }

    public function test_perekam_bisa_menghapus_setoran(): void
    {
        $this->actingAs($this->guru, 'sanctum')
            ->deleteJson('/api/progres-hafalan/'.$this->setoran->id)
            ->assertStatus(204);

        $this->assertDatabaseMissing('progres_hafalans', ['id' => $this->setoran->id]);
    }
}
