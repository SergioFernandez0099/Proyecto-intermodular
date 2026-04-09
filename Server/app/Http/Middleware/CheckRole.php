<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Http\Request;

class CheckRole
{
    public function handle(Request $request, Closure $next, string $role): mixed
    {

        if ($request->user()?->role !== $role) {
            throw new AuthorizationException();
        }

        return $next($request);
    }
}
