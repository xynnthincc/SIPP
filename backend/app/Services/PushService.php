<?php

namespace App\Services;

use App\Models\DeviceToken;
use App\Models\Notification;
use App\Models\User;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Pusat notifikasi: menyimpan baris DB + mengirim push FCM (jika terkonfigurasi).
 *
 * FCM memakai HTTP v1 dengan OAuth2 (JWT RS256 dari service account Firebase).
 * Kalau FCM belum dikonfigurasi (env FCM_PROJECT_ID / FCM_SERVICE_ACCOUNT kosong),
 * notifikasi tetap tersimpan di tabel `notifications` — push hanya dilewati.
 */
class PushService
{
    public const TYPE_CATATAN_GURU = 'catatan_guru';

    public const TYPE_IZIN_BARU = 'izin_baru';

    public const TYPE_IZIN_STATUS = 'izin_status';

    public const TYPE_RAPOR_SIAP = 'rapor_siap';

    public function notify(User $user, string $type, string $title, string $body, ?string $url = null, array $payload = []): Notification
    {
        $notification = Notification::create([
            'user_id' => $user->id,
            'type' => $type,
            'title' => $title,
            'body' => $body,
            'url' => $url,
            'payload' => $payload,
        ]);

        $this->kirimPush($user, $title, $body, $url, $type, $payload);

        return $notification;
    }

    public function notifyMany(iterable $users, string $type, string $title, string $body, ?string $url = null, array $payload = []): void
    {
        foreach ($users as $user) {
            if ($user instanceof User) {
                $this->notify($user, $type, $title, $body, $url, $payload);
            }
        }
    }

    private function kirimPush(User $user, string $title, string $body, ?string $url, string $type, array $payload): void
    {
        $cfg = $this->configFcm();
        if ($cfg === null) {
            return;
        }

        $tokens = DeviceToken::where('user_id', $user->id)->pluck('token');
        foreach ($tokens as $token) {
            try {
                $res = Http::withToken($this->accessToken($cfg['sa']))
                    ->acceptJson()
                    ->post("https://fcm.googleapis.com/v1/projects/{$cfg['project']}/messages:send", [
                        'message' => [
                            'token' => $token,
                            'notification' => ['title' => $title, 'body' => $body],
                            'data' => $this->dataPair($url, $type, $payload),
                        ],
                    ]);

                if ($res->status() === 404) {
                    // Token tidak lagi terdaftar di perangkat — bersihkan
                    DeviceToken::where('token', $token)->delete();
                } elseif ($res->failed()) {
                    Log::warning("FCM gagal dikirim ke token {$token}: ".$res->body());
                }
            } catch (\Throwable $e) {
                Log::warning('PushService::kirimPush error: '.$e->getMessage());
            }
        }
    }

    /** Semua nilai FCM data harus string */
    private function dataPair(?string $url, string $type, array $payload): array
    {
        return array_merge(
            ['type' => $type, 'url' => $url ?? ''],
            array_map(fn ($v) => is_scalar($v) ? (string) $v : json_encode($v, JSON_UNESCAPED_UNICODE), $payload)
        );
    }

    /** null jika FCM belum dikonfigurasi */
    private function configFcm(): ?array
    {
        $project = config('services.fcm.project_id');
        $path = config('services.fcm.service_account');

        if (blank($project) || blank($path) || ! is_file($path)) {
            return null;
        }

        $sa = json_decode((string) file_get_contents($path), true);
        if (! is_array($sa) || empty($sa['client_email']) || empty($sa['private_key']) || empty($sa['token_uri'])) {
            return null;
        }

        return ['project' => $project, 'sa' => $sa];
    }

    /** Token akses OAuth2 (cache ~55 menit) dari service account */
    private function accessToken(array $sa): string
    {
        $now = time();

        return Cache::remember('fcm.access_token', now()->addSeconds(3300), function () use ($sa, $now) {
            $b64u = fn (string $s) => rtrim(strtr(base64_encode($s), '+/', '-_'), '=');
            $header = $b64u(json_encode(['alg' => 'RS256', 'typ' => 'JWT']));
            $claims = $b64u(json_encode([
                'iss' => $sa['client_email'],
                'scope' => 'https://www.googleapis.com/auth/firebase.messaging',
                'aud' => $sa['token_uri'],
                'iat' => $now,
                'exp' => $now + 3600,
            ]));

            $signingInput = $header.'.'.$claims;
            openssl_sign($signingInput, $signature, openssl_pkey_get_private($sa['private_key']), 'SHA256');
            $assertion = $signingInput.'.'.$b64u($signature);

            $res = Http::asForm()->post($sa['token_uri'], [
                'grant_type' => 'urn:ietf:params:oauth:grant-type:jwt-bearer',
                'assertion' => $assertion,
            ]);

            return $res->json('access_token');
        });
    }
}
