<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
use Laravel\Socialite\Facades\Socialite;

class GoogleController extends Controller
{
    public function redirect()
    {
        return Socialite::driver('google')->redirect();
    }

    public function callback()
    {
        $googleUser = Socialite::driver('google')->user();

        $user = User::firstOrCreate(
            ['email' => $googleUser->getEmail()],
            [
                'name' => $googleUser->user['given_name'] ?? $googleUser->getName(),
                'lastname' => $googleUser->user['family_name'] ?? '',
                'password' => bcrypt(Str::random(24)),
                'email_verified_at' => now(),
            ]
        );

        if (!$user->active) {
            // Redirige al frontend con error
            return redirect(env('FRONTEND_URL') . '/login?error=cuenta_desactivada');
        }

        Auth::login($user);
        request()->session()->regenerate();

        return redirect(env('FRONTEND_URL') . '/dashboard');
    }
}
