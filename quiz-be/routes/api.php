<?php

use Illuminate\Support\Facades\Route;

// ── Public: player join + game state ─────────────────────────────────────────
Route::post('/rooms/{code}/join', [\App\Http\Controllers\GameController::class, 'join']);
Route::get('/games/{id}/state', [\App\Http\Controllers\GameController::class, 'publicState']);
Route::get('/games/{id}/leaderboard', [\App\Http\Controllers\GameController::class, 'leaderboard']);

Route::get('/rooms/code/{code}', [\App\Http\Controllers\RoomController::class, 'getByCode']);

// ── Player (authenticated as team via player-token) ───────────────────────────
Route::middleware('auth:sanctum')->post('/games/submit', [\App\Http\Controllers\GameController::class, 'submitAnswer']);

// ── Admin ─────────────────────────────────────────────────────────────────────
Route::group(['prefix' => 'admin'], function () {
    Route::post('/login', [\App\Http\Controllers\AuthController::class, 'adminLogin']);

    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/logout', [\App\Http\Controllers\AuthController::class, 'adminLogout']);

        // Questions
        Route::post('/questions/import', [\App\Http\Controllers\QuestionController::class, 'import']);
        Route::apiResource('questions', \App\Http\Controllers\QuestionController::class);

        // Rooms — flat list via GameController, create/delete via RoomController
        Route::get('/rooms', [\App\Http\Controllers\GameController::class, 'index']);
        Route::apiResource('rooms', \App\Http\Controllers\RoomController::class)->except(['index']);

        // Game flow controls
        Route::get('/games/{id}/state', [\App\Http\Controllers\GameController::class, 'adminState']);
        Route::post('/games/{id}/start', [\App\Http\Controllers\GameController::class, 'start']);
        Route::post('/games/{id}/start-round', [\App\Http\Controllers\GameController::class, 'startRound']);
        Route::post('/games/{id}/open-question', [\App\Http\Controllers\GameController::class, 'openQuestion']);
        Route::post('/games/{id}/close-question', [\App\Http\Controllers\GameController::class, 'closeQuestion']);
        Route::post('/games/{id}/finish-round', [\App\Http\Controllers\GameController::class, 'finishRound']);
        Route::post('/games/{id}/finish', [\App\Http\Controllers\GameController::class, 'finish']);
    });
});
