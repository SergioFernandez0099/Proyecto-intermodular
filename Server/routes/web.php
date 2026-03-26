<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\UserController;
use App\Http\Controllers\BookController;
use App\Http\Controllers\AuthorController;
use App\Http\Controllers\GenreController;
use App\Http\Controllers\GoogleController;

Route::get('/', function () {return response()->json(['message' => 'API works!', 'test' => 'Another entry'], 200);});

Route::post('api/login', [UserController::class, 'login']);
Route::post('api/users', [UserController::class, 'store']);

Route::get('api/users', [UserController::class, 'index']);
Route::get('api/users/{id}', [UserController::class, 'show']);
Route::put('api/users/{id}', [UserController::class, 'update']);
Route::delete('api/users/{id}', [UserController::class, 'destroy']);

Route::get('api/books', [BookController::class, 'index']);
Route::get('api/books/{id}', [BookController::class, 'show']);
Route::post('api/books', [BookController::class, 'store']);
Route::put('api/books/{id}', [BookController::class, 'update']);
Route::delete('api/books/{id}', [BookController::class, 'destroy']);

Route::get('api/authors', [AuthorController::class, 'index']);
Route::get('api/authors/{id}', [AuthorController::class, 'show']);
Route::post('api/authors', [AuthorController::class, 'store']);
Route::put('api/authors/{id}', [AuthorController::class, 'update']);
Route::delete('api/authors/{id}', [AuthorController::class, 'destroy']);

Route::get('api/genres', [GenreController::class, 'index']);
Route::get('api/genres/{id}', [GenreController::class, 'show']);
Route::post('api/genres', [GenreController::class, 'store']);
Route::put('api/genres/{id}', [GenreController::class, 'update']);
Route::delete('api/genres/{id}', [GenreController::class, 'destroy']);
