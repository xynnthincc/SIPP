<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\DeviceToken;
use Illuminate\Http\Request;

class DeviceTokenController extends Controller
{
    /** Daftarkan token perangkat untuk push — dipanggil app saat login */
    public function store(Request $request)
    {
        $data = $request->validate([
            'platform' => ['required', 'in:android,ios,web'],
            'token' => ['required', 'string', 'max:512'],
        ]);

        $user = $request->user();

        DeviceToken::updateOrCreate(
            ['token' => $data['token']],
            ['user_id' => $user->id, 'platform' => $data['platform'], 'last_used_at' => now()]
        );

        return response()->json(['registered' => true], 201);
    }

    /** Hapus token saat user logout dari app */
    public function destroy(Request $request)
    {
        $data = $request->validate([
            'token' => ['required', 'string', 'max:512'],
        ]);

        DeviceToken::where('token', $data['token'])
            ->where('user_id', $request->user()->id)
            ->delete();

        return response()->json(['registered' => false]);
    }
}
