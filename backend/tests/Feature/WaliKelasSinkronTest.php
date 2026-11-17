<?php

namespace Tests\Feature;

use App\Models\Guru;
use App\Models\KelasRombel;
use App\Models\TahunAjaran;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class WaliKelasSinkronTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    private User $guru;

    private TahunAjaran $tahun;

    protected function setUp(): void
    {
        parent::setUp();

        $this->admin = User::create([
            'name' => 'Admin Tes',
            'email' => 'admin-tes@sipp.test',
            'password' => Hash::make('password'),
            'role' => User::ROLE_ADMIN,
        ]);

        $this->guru = User::create([
            'name' => 'Guru Tes',
            'email' => 'guru-tes@sipp.test',
            'password' => Hash::make('password'),
            'role' => User::ROLE_GURU_PESANTREN,
        ]);
        Guru::create(['user_id' => $this->guru->id, 'nama' => 'Guru Tes']);

        $this->tahun = TahunAjaran::create(['nama' => '2026/2027', 'is_aktif' => true]);
    }

    private function buatKelas(string $nama): KelasRombel
    {
        return KelasRombel::create([
            'nama' => $nama,
            'tingkat' => (int) substr($nama, 0, 1),
            'tahun_ajaran_id' => $this->tahun->id,
        ]);
    }

    public function test_tunjuk_wali_kelas_otomatis_naikkan_role(): void
    {
        $kelas = $this->buatKelas('7A');

        $this->actingAs($this->admin, 'sanctum')
            ->putJson("/api/kelas-rombel/{$kelas->id}", [
                'wali_kelas_id' => $this->guru->id,
            ])
            ->assertOk();

        $this->assertSame(User::ROLE_WALI_KELAS, $this->guru->fresh()->role);
    }

    public function test_copot_wali_kelas_otomatis_turunkan_role(): void
    {
        $kelas = $this->buatKelas('7A');

        $this->actingAs($this->admin, 'sanctum')
            ->putJson("/api/kelas-rombel/{$kelas->id}", ['wali_kelas_id' => $this->guru->id])
            ->assertOk();

        $this->actingAs($this->admin, 'sanctum')
            ->putJson("/api/kelas-rombel/{$kelas->id}", ['wali_kelas_id' => null])
            ->assertOk();

        $this->assertSame(User::ROLE_GURU_PESANTREN, $this->guru->fresh()->role);
    }

    public function test_wali_yang_masih_mengwalikan_kelas_lain_tidak_turun_role(): void
    {
        $kelasA = $this->buatKelas('7A');
        $kelasB = $this->buatKelas('7B');

        $this->guru->update(['role' => User::ROLE_WALI_KELAS]);
        $kelasA->update(['wali_kelas_id' => $this->guru->id]);
        $kelasB->update(['wali_kelas_id' => $this->guru->id]);

        // Dicopot dari kelas A, tapi masih wali kelas B → role tetap wali_kelas
        $this->actingAs($this->admin, 'sanctum')
            ->putJson("/api/kelas-rombel/{$kelasA->id}", ['wali_kelas_id' => null])
            ->assertOk();

        $this->assertSame(User::ROLE_WALI_KELAS, $this->guru->fresh()->role);
    }

    public function test_buat_kelas_baru_dengan_wali_langsung_naik_role(): void
    {
        $this->actingAs($this->admin, 'sanctum')
            ->postJson('/api/kelas-rombel', [
                'nama' => '7A',
                'tingkat' => 7,
                'tahun_ajaran_id' => $this->tahun->id,
                'wali_kelas_id' => $this->guru->id,
            ])
            ->assertCreated();

        $this->assertSame(User::ROLE_WALI_KELAS, $this->guru->fresh()->role);
    }

    public function test_hapus_kelas_turunkan_role_wali(): void
    {
        $kelas = KelasRombel::create([
            'nama' => '7A',
            'tingkat' => 7,
            'tahun_ajaran_id' => $this->tahun->id,
            'wali_kelas_id' => $this->guru->id,
        ]);
        $this->guru->update(['role' => User::ROLE_WALI_KELAS]);

        $this->actingAs($this->admin, 'sanctum')
            ->deleteJson("/api/kelas-rombel/{$kelas->id}")
            ->assertNoContent();

        $this->assertSame(User::ROLE_GURU_PESANTREN, $this->guru->fresh()->role);
    }

    public function test_role_admin_tidak_ikut_diubah(): void
    {
        $kelas = $this->buatKelas('7A');

        $this->actingAs($this->admin, 'sanctum')
            ->putJson("/api/kelas-rombel/{$kelas->id}", ['wali_kelas_id' => $this->admin->id])
            ->assertOk();

        $this->assertSame(User::ROLE_ADMIN, $this->admin->fresh()->role);
    }
}
