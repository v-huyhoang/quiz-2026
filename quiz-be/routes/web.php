<?php

use Illuminate\Support\Facades\Route;
use App\Events\TestMessage;

Route::get('/', function () {
    return view('welcome');
});

Route::get('/broadcast-test', function () {
    broadcast(new TestMessage('Hello Reverb'));

    return 'Broadcast sent!';
});