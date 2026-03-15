<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\UserController;

Route::get('/', function () {return response()->json(['message' => 'API works!', 'test' => 'Another entry'], 200);;});
Route::get('api/users', [UserController::class, 'index']);
Route::get('api/users/{id}', [UserController::class, 'show']);
Route::post('api/users', [UserController::class, 'store']);
Route::put('api/users/{id}', [UserController::class, 'update']);
Route::delete('api/users/{id}', [UserController::class, 'destroy']);






