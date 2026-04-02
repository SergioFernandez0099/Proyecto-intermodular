<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Laravel\Socialite\Facades\Socialite;
use Illuminate\Support\Str;

class GoogleController extends Controller
{
    public function redirect()
    {
        return Socialite::driver('google')->stateless()->redirect();
    }

    public function callback()
    {
        $googleUser = Socialite::driver('google')->stateless()->user();

        $user = User::firstOrCreate(
            ['email' => $googleUser->getEmail()],
            [
                'name'              => $googleUser->user['given_name'] ?? $googleUser->getName(),
                'lastname'          => $googleUser->user['family_name'] ?? '',
                'password'          => bcrypt(Str::random(24)),
                'email_verified_at' => now(),
            ]
        );

        if (! $user->active) {
            return response()->json(['message' => 'Cuenta desactivada.'], 403);
        }

        $token = $user->createToken('google-token')->plainTextToken;

        return response()->json(['user' => $user, 'token' => $token]);
    }
}
