<?php

namespace Tests\Feature;

use App\Models\Guru;
use App\Models\GuruMapelKelas;
use App\Models\Jadwal;
use App\Models\KehadiranRekap;
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
 * Regresi: presensi harian yang diinput guru mapel harus tampil di rapor
 * (sebelumnya rapor hanya membaca rekap manual wali kelas).
 */
class PresensiRaporTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    private User $guru;

    private Semester $semester;

    private KelasRombel $kelas;

    private Siswa $siswa;

    private Jadwal $jadwal1;

    private Jadwal $jadwal2;

    protected function setUp(): void
    {
        parent::setUp();

        $this->admin = User::create([
            'name' => 'Admin Tes', 'email' => 'admin-pr@sipp.test',
            'password' => Hash::make('password'), 'role' => User::ROLE_ADMIN,
        ]);
        $this->guru = User::create([
            'name' => 'Guru Ujian', 'email' => 'guru-pr@sipp.test',
            'password' => Hash::make('password'), 'role' => User::ROLE_GURU_PESANTREN,
        ]);
        Guru::create(['user_id' => $this->guru->id, 'nama' => 'Guru Ujian']);

        $tahun = TahunAjaran::create(['nama' => '2026/2027', 'is_aktif' => true]);
        $this->semester = Semester::create([
            'tahun_ajaran_id' => $tahun->id, 'nama' => 'Ganjil',
            'is_aktif' => true, 'penilaian_dibuka' => true,
        ]);
        $this->kelas = KelasRombel::create([
            'nama' => '7A', 'tingkat' => 7, 'tahun_ajaran_id' => $tahun->id,
        ]);
        $this->siswa = Siswa::create([
            'nis' => '991001', 'nama' => 'Siswa Presensi', 'jenis_kelamin' => 'L',
            'kelas_rombel_id' => $this->kelas->id,
        ]);

        $mapel = MapelPlus::create(['kode' => 'TAHFIDZ', 'nama' => 'Tahfidz', 'kkm_default' => 75]);
        $pengampu = GuruMapelKelas::create([
            'guru_id' => $this->guru->guru->id,
            'mapel_plus_id' => $mapel->id,
            'kelas_rombel_id' => $this->kelas->id,
            'semester_id' => $this->semester->id,
        ]);
        $this->jadwal1 = Jadwal::create([
            'guru_mapel_kelas_id' => $pengampu->id,
            'hari' => 'Senin', 'jam_mulai' => '07:00', 'jam_selesai' => '08:00',
        ]);
        $this->jadwal2 = Jadwal::create([
            'guru_mapel_kelas_id' => $pengampu->id,
            'hari' => 'Selasa', 'jam_mulai' => '07:00', 'jam_selesai' => '08:00',
        ]);
    }

    private function catatPresensi(User $user, int $jadwalId, string $tanggal, string $status): void
    {
        $this->actingAs($user, 'sanctum')
            ->postJson('/api/presensi/massal', [
                'jadwal_id' => $jadwalId,
                'tanggal' => $tanggal,
                'presensi' => [['siswa_id' => $this->siswa->id, 'status' => $status]],
            ])
            ->assertStatus(200);
    }

    public function test_presensi_guru_dihitung_per_hari_di_rapor(): void
    {
        $this->catatPresensi($this->guru, $this->jadwal1->id, '2026-09-01', 'Sakit');
        $this->catatPresensi($this->guru, $this->jadwal1->id, '2026-09-02', 'Sakit');
        $this->catatPresensi($this->guru, $this->jadwal1->id, '2026-09-03', 'Alpa');
        // Dua sesi berbeda di hari yang sama dihitung SATU hari
        $this->catatPresensi($this->guru, $this->jadwal2->id, '2026-09-01', 'Sakit');

        $this->actingAs($this->admin, 'sanctum')
            ->getJson('/api/rapor/cetak?siswa_id='.$this->siswa->id.'&semester_id='.$this->semester->id)
            ->assertStatus(200)
            ->assertJsonPath('kehadiran.sakit', 2)
            ->assertJsonPath('kehadiran.izin', 0)
            ->assertJsonPath('kehadiran.alpa', 1);
    }

    public function test_fallback_ke_rekap_manual_bila_tanpa_presensi(): void
    {
        KehadiranRekap::create([
            'siswa_id' => $this->siswa->id, 'semester_id' => $this->semester->id,
            'sakit' => 1, 'izin' => 2, 'alpa' => 3,
        ]);

        $this->actingAs($this->admin, 'sanctum')
            ->getJson('/api/rapor/cetak?siswa_id='.$this->siswa->id.'&semester_id='.$this->semester->id)
            ->assertStatus(200)
            ->assertJsonPath('kehadiran.sakit', 1)
            ->assertJsonPath('kehadiran.izin', 2)
            ->assertJsonPath('kehadiran.alpa', 3);
    }

    public function test_rapor_tanpa_data_kehadiran_apapun_null(): void
    {
        $this->actingAs($this->admin, 'sanctum')
            ->getJson('/api/rapor/cetak?siswa_id='.$this->siswa->id.'&semester_id='.$this->semester->id)
            ->assertStatus(200)
            ->assertJsonPath('kehadiran', null);
    }

    public function test_progres_menandai_kehadiran_terisi_dari_presensi(): void
    {
        $this->catatPresensi($this->guru, $this->jadwal1->id, '2026-09-01', 'Hadir');

        $this->actingAs($this->admin, 'sanctum')
            ->getJson('/api/rapor/progres?semester_id='.$this->semester->id)
            ->assertStatus(200)
            ->assertJsonPath('0.kehadiran_terisi', true);
    }
}
