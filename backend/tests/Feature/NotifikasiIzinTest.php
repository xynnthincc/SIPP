<?php

namespace Tests\Feature;

use App\Models\Guru;
use App\Models\KelasRombel;
use App\Models\Siswa;
use App\Models\TahunAjaran;
use App\Models\User;
use App\Services\PushService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class NotifikasiIzinTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    private User $wali;

    private User $guru;

    private User $ortu;

    private Siswa $siswa;

    protected function setUp(): void
    {
        parent::setUp();

        $this->admin = User::create(['name' => 'Admin Tes', 'email' => 'admin-tes@sipp.test', 'password' => Hash::make('password'), 'role' => User::ROLE_ADMIN]);

        $this->wali = User::create(['name' => 'Wali Kelas Tes', 'email' => 'wali-tes@sipp.test', 'password' => Hash::make('password'), 'role' => User::ROLE_WALI_KELAS]);

        $this->guru = User::create(['name' => 'Guru Ujian', 'email' => 'guru-ujian@sipp.test', 'password' => Hash::make('password'), 'role' => User::ROLE_GURU_PESANTREN]);
        Guru::create(['user_id' => $this->guru->id, 'nama' => 'Guru Ujian']);

        $this->ortu = User::create(['name' => 'Orang Tua Tes', 'email' => 'ortu-tes@sipp.test', 'password' => Hash::make('password'), 'role' => User::ROLE_ORANG_TUA]);

        $tahun = TahunAjaran::create(['nama' => '2026/2027', 'is_aktif' => true]);
        $kelas = KelasRombel::create([
            'nama' => 'Qitsmu Awwal',
            'tingkat' => 1,
            'tahun_ajaran_id' => $tahun->id,
            'wali_kelas_id' => $this->wali->id,
        ]);

        $this->siswa = Siswa::create([
            'nis' => '988001',
            'nama' => 'Santri Tes',
            'jenis_kelamin' => 'L',
            'kelas_rombel_id' => $kelas->id,
        ]);
        $this->siswa->wali()->attach($this->ortu->id, ['hubungan' => 'Ayah']);
    }

    public function test_guru_membuat_catatan_memicu_notif_untuk_ortu(): void
    {
        $this->actingAs($this->guru, 'sanctum')
            ->postJson('/api/catatan-guru', [
                'siswa_id' => $this->siswa->id,
                'tanggal' => '2026-09-20',
                'catatan' => 'Hafalan sudah lancar sampai An-Naba.',
            ])->assertCreated();

        $this->actingAs($this->ortu, 'sanctum')
            ->getJson('/api/notifications')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.type', PushService::TYPE_CATATAN_GURU)
            ->assertJsonPath('data.0.title', 'Catatan Guru');

        $this->assertDatabaseHas('notifications', ['user_id' => $this->ortu->id, 'type' => PushService::TYPE_CATATAN_GURU]);
    }

    public function test_catatan_bisa_sertakan_lampiran(): void
    {
        Storage::fake('public');

        $this->actingAs($this->guru, 'sanctum')
            ->post('/api/catatan-guru', [
                'siswa_id' => $this->siswa->id,
                'tanggal' => '2026-09-20',
                'catatan' => 'Perlu perhatian khusus.',
                'lampiran' => UploadedFile::fake()->image('foto.png'),
            ])->assertCreated();

        $this->assertNotNull($this->siswa->catatanGurus()->first()->lampiran);
    }

    public function test_ortu_mengajukan_izin_memicu_notif_wali_kelas(): void
    {
        $this->actingAs($this->ortu, 'sanctum')
            ->postJson('/api/izin', [
                'siswa_id' => $this->siswa->id,
                'jenis' => 'Sakit',
                'tanggal_mulai' => '2026-09-21',
                'tanggal_selesai' => '2026-09-22',
                'alasan' => 'Demam tinggi, perlu istirahat.',
            ])->assertCreated();

        $this->assertDatabaseHas('izins', ['siswa_id' => $this->siswa->id, 'status' => 'pending']);
        $this->assertDatabaseHas('notifications', ['user_id' => $this->wali->id, 'type' => PushService::TYPE_IZIN_BARU]);

        $this->actingAs($this->wali, 'sanctum')
            ->getJson('/api/izin?status=pending')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.siswa.nama', 'Santri Tes');
    }

    public function test_ortu_tidak_bisa_mengajukan_untuk_anak_orang_lain(): void
    {
        $siswaLain = Siswa::create(['nis' => '988002', 'nama' => 'Anak Orang Lain', 'jenis_kelamin' => 'P']);

        $this->actingAs($this->ortu, 'sanctum')
            ->postJson('/api/izin', [
                'siswa_id' => $siswaLain->id,
                'jenis' => 'Keperluan Keluarga',
                'tanggal_mulai' => '2026-09-21',
                'tanggal_selesai' => '2026-09-21',
                'alasan' => 'Acara keluarga.',
            ])->assertForbidden();
    }

    public function test_wali_kelas_menyetujui_izin_dan_ortu_dapat_notif(): void
    {
        $izin = $this->siswa->izins()->create([
            'jenis' => 'Izin',
            'tanggal_mulai' => '2026-09-21',
            'tanggal_selesai' => '2026-09-23',
            'alasan' => 'Kunjungan keluarga.',
            'status' => 'pending',
            'diajukan_oleh' => $this->ortu->id,
        ]);

        $this->actingAs($this->wali, 'sanctum')
            ->postJson("/api/izin/{$izin->id}/status", ['status' => 'disetujui', 'catatan' => 'Silakan istirahat.'])
            ->assertOk()
            ->assertJsonPath('status', 'disetujui')
            ->assertJsonPath('penyetuju.id', $this->wali->id);

        $this->assertDatabaseHas('notifications', ['user_id' => $this->ortu->id, 'type' => PushService::TYPE_IZIN_STATUS]);

        $this->actingAs($this->ortu, 'sanctum')
            ->getJson('/api/izin')
            ->assertOk()
            ->assertJsonPath('data.0.status', 'disetujui');
    }

    public function test_wali_kelas_lain_tidak_bisa_menyetujui_izin(): void
    {
        $izin = $this->siswa->izins()->create([
            'jenis' => 'Sakit', 'tanggal_mulai' => '2026-09-21', 'tanggal_selesai' => '2026-09-21',
            'alasan' => 'Sakit.', 'status' => 'pending', 'diajukan_oleh' => $this->ortu->id,
        ]);

        $waliLain = User::create(['name' => 'Wali Lain', 'email' => 'wali-lain@sipp.test', 'password' => Hash::make('password'), 'role' => User::ROLE_WALI_KELAS]);

        $this->actingAs($waliLain, 'sanctum')
            ->postJson("/api/izin/{$izin->id}/status", ['status' => 'disetujui'])
            ->assertForbidden();
    }

    public function test_register_device_token_dan_bisa_menghapus(): void
    {
        $token = 'fcm-token-abc-123';

        $this->actingAs($this->ortu, 'sanctum')
            ->postJson('/api/device-token', ['platform' => 'android', 'token' => $token])
            ->assertCreated();

        $this->assertDatabaseHas('device_tokens', ['user_id' => $this->ortu->id, 'token' => $token, 'platform' => 'android']);

        // Token sama didaftarkan user lain → kepemilikan pindah
        $this->actingAs($this->wali, 'sanctum')
            ->postJson('/api/device-token', ['platform' => 'android', 'token' => $token])
            ->assertCreated();

        $this->assertDatabaseHas('device_tokens', ['user_id' => $this->wali->id, 'token' => $token]);
        $this->assertDatabaseMissing('device_tokens', ['user_id' => $this->ortu->id, 'token' => $token]);

        $this->actingAs($this->wali, 'sanctum')
            ->deleteJson('/api/device-token', ['token' => $token])
            ->assertOk();

        $this->assertDatabaseMissing('device_tokens', ['token' => $token]);
    }

    public function test_notifikasi_bisa_ditandai_dibaca(): void
    {
        $notif = $this->ortu->notifications()->create([
            'type' => PushService::TYPE_CATATAN_GURU,
            'title' => 'Catatan Guru',
            'body' => 'Tes',
        ]);

        $this->actingAs($this->ortu, 'sanctum')
            ->getJson('/api/notifications?unread_only=true')
            ->assertJsonCount(1, 'data');

        $this->actingAs($this->ortu, 'sanctum')
            ->postJson("/api/notifications/{$notif->id}/read")
            ->assertOk()
            ->assertJsonPath('read_at', $notif->fresh()->read_at?->toISOString());

        $this->actingAs($this->ortu, 'sanctum')
            ->getJson('/api/notifications?unread_only=true')
            ->assertJsonCount(0, 'data');
    }

    public function test_tidak_bisa_tandai_baca_notifikasi_orang_lain(): void
    {
        $notif = $this->ortu->notifications()->create([
            'type' => 'x', 'title' => 'Rahasia', 'body' => 'x',
        ]);

        $this->actingAs($this->wali, 'sanctum')
            ->postJson("/api/notifications/{$notif->id}/read")
            ->assertForbidden();
    }
}
