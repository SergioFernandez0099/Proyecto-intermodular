<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{

    /// {
    //  "name": "Juan",
    //  "lastname": "Pérez",
    //  "email": "juan@mail.com",
    //  "password": "12345678",
    //  "password_confirmation": "12345678"
    // }
    public function register(Request $request)
    {
        $data = $request->validate([
            'name'     => 'required|string|max:255',
            'lastname' => 'required|string|max:255',
            'email'    => 'required|email|unique:users',
            'password' => 'required|string|min:8|confirmed',
        ]);

        $user = User::create($data);

        Auth::login($user);

        return (new UserResource($user))
            ->response()
            ->setStatusCode(201);
    }

    public function login(Request $request)
    {
        $request->validate([
            'email'    => 'required|email',
            'password' => 'required|string',
        ]);

        if (! Auth::attempt($request->only('email', 'password'))) {
            throw ValidationException::withMessages([
                'email or password' => ['Credenciales incorrectas.'],
            ]);
        }

        $user = Auth::user();

        if (! $user->active) {
            Auth::logout();
            return response()->json(['message' => 'Cuenta desactivada.'], 403);
        }

        return (new UserResource($user))->response();
    }

    public function logout(Request $request)
    {
        Auth::guard('web')->logout();

        return response()->json(['message' => 'Sesión cerrada correctamente.']);
    }

    public function me(Request $request)
    {
        return new UserResource($request->user());
    }

    public function updateMe(Request $request)
    {
        $user = $request->user();

        $data = $request->validate([
            'name'         => 'sometimes|string|max:255',
            'lastname'     => 'sometimes|string|max:255',
            'email'        => 'sometimes|email|unique:users,email,' . $user->id,
            'password'     => 'sometimes|string|min:8|confirmed',
        ]);

        $user->update($data);

        return new UserResource($user);
    }

    public function deleteMe(Request $request)
    {
        $user = $request->user();

        Auth::logout();
        $user->delete();

        return response()->json(null, 204);
    }
}
