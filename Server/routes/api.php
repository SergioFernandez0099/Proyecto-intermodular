<?php

use App\Http\Controllers\Auth\AuthController;
use App\Http\Controllers\Auth\GoogleController;
use App\Http\Controllers\BookController;
use App\Http\Controllers\AuthorController;
use App\Http\Controllers\GenreController;
use App\Http\Controllers\CopyController;
use App\Http\Controllers\LoanController;
use App\Http\Controllers\RatingController;
use App\Http\Controllers\UserController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| AUTH - Pública
|--------------------------------------------------------------------------
*/
Route::prefix('auth')->group(function () {
    Route::post('register', [AuthController::class, 'register']);
    Route::post('login',    [AuthController::class, 'login']);

    // Google OAuth
    Route::get('google/redirect',  [GoogleController::class, 'redirect']);
    Route::get('google/callback',  [GoogleController::class, 'callback']);
});

/*
|--------------------------------------------------------------------------
| RUTAS PROTEGIDAS - Requieren token Sanctum
|--------------------------------------------------------------------------
*/
Route::middleware('auth:sanctum')->group(function () {

    // Auth
    Route::prefix('auth')->group(function () {
        Route::post('logout', [AuthController::class, 'logout']);
        Route::get('me',      [AuthController::class, 'me']);
    });

    /*
    | GÉNEROS
    */
    Route::apiResource('genres', GenreController::class)
        ->middleware([
            'store'   => 'role:admin',
            'update'  => 'role:admin',
            'destroy' => 'role:admin',
        ]);

    /*
    | AUTORES
    */
    Route::apiResource('authors', AuthorController::class)
        ->middleware([
            'store'   => 'role:admin',
            'update'  => 'role:admin',
            'destroy' => 'role:admin',
        ]);

    /*
    | LIBROS
    */
    Route::apiResource('books', BookController::class)
        ->middleware([
            'store'   => 'role:admin',
            'update'  => 'role:admin',
            'destroy' => 'role:admin',
        ]);

    Route::prefix('books/{book}')->group(function () {
        Route::get('copies',  [CopyController::class,  'byBook']);
        Route::post('copies',         [CopyController::class, 'storeByBook']);
        Route::post('ratings',                [RatingController::class, 'store']);
        Route::put('ratings/{rating}',        [RatingController::class, 'update']);
        Route::delete('ratings/{rating}',     [RatingController::class, 'destroy']);
    });

    /*
    | COPIAS - Solo admin
    */
    Route::apiResource('copies', CopyController::class)
        ->middleware('role:admin');

    /*
    | PRÉSTAMOS
    */
    Route::apiResource('loans', LoanController::class)
        ->only(['index', 'store', 'show']);

    Route::patch('loans/{loan}/return', [LoanController::class, 'return']);

    /*
    | USUARIOS
    */
    Route::middleware('role:admin')->prefix('users')->group(function () {
        Route::get('/',                   [UserController::class, 'index']);
        Route::get('{user}',              [UserController::class, 'show']);
        Route::put('{user}',              [UserController::class, 'update']);
        Route::patch('{user}/activate',   [UserController::class, 'activate']);
        Route::patch('{user}/deactivate', [UserController::class, 'deactivate']);
        Route::delete('{user}',           [UserController::class, 'destroy']);
    });
});

