<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'token' => env('POSTMARK_TOKEN'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'resend' => [
        'key' => env('RESEND_KEY'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    /*
    | FCM (Firebase Cloud Messaging) untuk push notification ke aplikasi.
    | FCM_PROJECT_ID + FCM_SERVICE_ACCOUNT (path absolut JSON service account).
    | Jika kosong, notifikasi TETAP tersimpan di DB — hanya push yang dilewati.
    */
    'fcm' => [
        'project_id' => env('FCM_PROJECT_ID'),
        'service_account' => env('FCM_SERVICE_ACCOUNT'),
    ],

    /*
    | Render rapor menjadi PDF. Driver:
    |   html  -> kembalikan HTML (default; app render via WebView/print)
    |   chrome-> proses via Browsershot (node + puppeteer), output PDF sungguhan
    */
    'rapor' => [
        'pdf_driver' => env('RAPOR_PDF_DRIVER', 'html'),
    ],

];
