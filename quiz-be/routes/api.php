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
        Route::apiResource('questions', \App\Http\Controllers\QuestionController::class);
    });
});
