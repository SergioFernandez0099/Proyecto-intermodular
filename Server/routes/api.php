<?php

use App\Http\Controllers\Auth\AuthController;
use App\Http\Controllers\AuthorController;
use App\Http\Controllers\BookController;
use App\Http\Controllers\CopyController;
use App\Http\Controllers\GenreController;
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
    Route::post('login', [AuthController::class, 'login']);
});

/*
|--------------------------------------------------------------------------
| RUTAS PROTEGIDAS
|--------------------------------------------------------------------------
*/
Route::middleware(['auth:sanctum', 'active'])->group(function () {

    Route::prefix('auth')->group(function () {
        Route::post('logout', [AuthController::class, 'logout']);
        Route::get('me', [AuthController::class, 'me']);
        Route::put('me', [AuthController::class, 'updateMe']);
        Route::delete('me', [AuthController::class, 'deleteMe']);
    });

    /*
    | GÉNEROS
    */
    Route::apiResource('genres', GenreController::class)
        ->only(['index', 'show']);

    Route::apiResource('genres', GenreController::class)
        ->only(['store', 'update', 'destroy'])
        ->middleware('role:admin');

    /*
    | AUTORES
    */
    Route::apiResource('authors', AuthorController::class)
        ->only(['index', 'show']);

    Route::apiResource('authors', AuthorController::class)
        ->only(['store', 'update', 'destroy'])
        ->middleware('role:admin');

    /*
    | LIBROS
    */
    Route::get('books/mine', [BookController::class, 'mine']);
    Route::post('books/import', [BookController::class, 'import']);

    Route::apiResource('books', BookController::class)
        ->only(['index', 'show', 'update', 'destroy', 'store']);

    Route::prefix('books/{book}')->group(function () {

        // COPIAS
        Route::get('copies', [CopyController::class, 'byBook']);
        Route::post('copies', [CopyController::class, 'storeByBook']);
        Route::patch('copies/{copy}', [CopyController::class, 'update'])->middleware('role:admin');
        Route::delete('copies/{copy}', [CopyController::class, 'destroy']);

        // PORTADA
        Route::post('cover', [BookController::class, 'updateCover']);
        Route::delete('cover', [BookController::class, 'deleteCover']);

        // RATINGS
        Route::post('ratings', [RatingController::class, 'store']);
        Route::put('ratings/{rating}', [RatingController::class, 'update']);
        Route::delete('ratings/{rating}', [RatingController::class, 'destroy']);
    });

    /*
    | PRÉSTAMOS
    */
    Route::apiResource('loans', LoanController::class)
        ->only(['index', 'store', 'show']);

    Route::patch('loans/{loan}/return', [LoanController::class, 'return']);

    /*
    | USUARIOS - Solo admin
    */
    Route::middleware('role:admin')->prefix('users')->group(function () {
        Route::get('/', [UserController::class, 'index']);
        Route::get('{user}', [UserController::class, 'show']);
        Route::put('{user}', [UserController::class, 'update']);
        Route::patch('{user}/activate', [UserController::class, 'activate']);
        Route::patch('{user}/deactivate', [UserController::class, 'deactivate']);
        Route::delete('{user}', [UserController::class, 'destroy']);
    });
});
