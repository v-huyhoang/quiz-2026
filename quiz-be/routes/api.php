<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

Route::group(['prefix' => 'admin'], function () {
    Route::post('/login', [\App\Http\Controllers\AuthController::class, 'adminLogin']);

    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/logout', [\App\Http\Controllers\AuthController::class, 'adminLogout']);
        Route::post('/questions/import', [\App\Http\Controllers\QuestionController::class, 'import']);
        Route::apiResource('questions', \App\Http\Controllers\QuestionController::class);
        Route::apiResource('rooms', \App\Http\Controllers\RoomController::class);

        // Game routes
        Route::post('/games/start', [\App\Http\Controllers\GameController::class, 'start']);
        Route::get('/games/active', [\App\Http\Controllers\GameController::class, 'getActive']);
        Route::get('/games/current-question', [\App\Http\Controllers\GameController::class, 'getCurrentQuestion']);
    });
});
