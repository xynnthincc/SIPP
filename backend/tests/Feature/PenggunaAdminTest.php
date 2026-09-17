<?php

namespace Tests\Feature;

use App\Models\Guru;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class PenggunaAdminTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    private User $guru;

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
            'name' => 'Guru Ujian',
            'email' => 'guru-ujian@sipp.test',
            'password' => Hash::make('password'),
            'role' => User::ROLE_GURU_PESANTREN,
        ]);
        Guru::create(['user_id' => $this->guru->id, 'nama' => 'Guru Ujian']);
    }

    public function test_admin_bisa_melihat_daftar_pengguna(): void
    {
        $this->actingAs($this->admin, 'sanctum')
            ->getJson('/api/user')
            ->assertOk()
            ->assertJsonCount(2)
            ->assertJsonFragment(['email' => 'guru-ujian@sipp.test']);
    }

    public function test_daftar_pengguna_bisa_difilter_per_role(): void
    {
        $this->actingAs($this->admin, 'sanctum')
            ->getJson('/api/user?role=guru_pesantren')
            ->assertOk()
            ->assertJsonCount(1)
            ->assertJsonFragment(['email' => 'guru-ujian@sipp.test']);
    }

    public function test_daftar_pengguna_bisa_dicari_dan_dipaginate(): void
    {
        $this->actingAs($this->admin, 'sanctum')
            ->getJson('/api/user?search=guru-ujian&page=1')
            ->assertOk()
            ->assertJsonPath('total', 1)
            ->assertJsonPath('data.0.email', 'guru-ujian@sipp.test');
    }

    /**
     * Middleware auth:sanctum memanggil Auth::shouldUse() yang mengubah guard
     * default dan meng-cache guard antar request dalam satu test — reset agar
     * request berikutnya (login/evaluasi token) dievaluasi bersih.
     */
    private function resetGuard(): void
    {
        $auth = $this->app->make('auth');
        $auth->forgetGuards();
        $auth->setDefaultDriver('web');
    }

    public function test_admin_bisa_update_email_dan_password_guru(): void
    {
        // Autentikasi admin via login sungguhan supaya guard session tetap utuh
        $adminToken = $this->postJson('/api/login', [
            'email' => 'admin-tes@sipp.test',
            'password' => 'password',
        ])->json('token');

        $this->withToken($adminToken)
            ->putJson("/api/user/{$this->guru->id}", [
                'email' => 'guru-baru@sipp.test',
                'password' => 'rahasia-baru',
            ])
            ->assertOk()
            ->assertJsonFragment(['email' => 'guru-baru@sipp.test']);

        // Login dengan kredensial baru harus berhasil
        $this->resetGuard();
        $this->postJson('/api/login', [
            'email' => 'guru-baru@sipp.test',
            'password' => 'rahasia-baru',
        ])->assertOk()->assertJsonPath('user.id', $this->guru->id);
    }

    public function test_ganti_password_mencabut_token_lama(): void
    {
        $token = $this->guru->createToken('tes')->plainTextToken;

        // Token admin dibuat langsung (tanpa /api/login) supaya tidak ada
        // sesi web yang ikut terbawa — guard sanctum punya fallback ke session.
        $adminToken = $this->admin->createToken('tes-admin')->plainTextToken;

        $this->withToken($adminToken)
            ->putJson("/api/user/{$this->guru->id}", ['password' => 'rahasia-baru'])
            ->assertOk();

        $this->resetGuard();
        $this->withToken($token)
            ->getJson('/api/me')
            ->assertUnauthorized();
    }

    public function test_email_tidak_boleh_duplikat(): void
    {
        $wali = User::create([
            'name' => 'Wali Tes',
            'email' => 'wali-tes@sipp.test',
            'password' => Hash::make('password'),
            'role' => User::ROLE_WALI_KELAS,
        ]);

        $this->actingAs($this->admin, 'sanctum')
            ->putJson("/api/user/{$this->guru->id}", ['email' => $wali->email])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('email');
    }

    public function test_admin_tidak_bisa_menonaktifkan_akunnya_sendiri(): void
    {
        $this->actingAs($this->admin, 'sanctum')
            ->putJson("/api/user/{$this->admin->id}", ['is_active' => false])
            ->assertStatus(422);
    }

    public function test_non_admin_ditolak(): void
    {
        $this->actingAs($this->guru, 'sanctum')
            ->getJson('/api/user')
            ->assertForbidden();

        $this->actingAs($this->guru, 'sanctum')
            ->putJson("/api/user/{$this->guru->id}", ['email' => 'bohong@sipp.test'])
            ->assertForbidden();
    }

    public function test_update_nama_sinkron_dengan_profil_guru(): void
    {
        $this->actingAs($this->admin, 'sanctum')
            ->putJson("/api/user/{$this->guru->id}", ['name' => 'Guru Baru'])
            ->assertOk();

        $this->assertSame('Guru Baru', $this->guru->fresh()->guru->nama);
    }
}
