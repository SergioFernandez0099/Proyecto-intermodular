<?php

use App\Http\Controllers\Auth\GoogleController;
use Illuminate\Support\Facades\Route;

/*
| Google OAuth - Necesita sesión, por eso va aquí y no en api.php
*/
Route::prefix('auth/google')->group(function () {
    Route::get('redirect', [GoogleController::class, 'redirect']);
    Route::get('callback', [GoogleController::class, 'callback']);
});
