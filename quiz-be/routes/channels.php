<?php

use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});

// Game channel - for players to listen to game-specific events
Broadcast::channel('game.{gameId}', function ($user, $gameId) {
    // Allow all authenticated users to join game channels
    // You can add additional authorization logic here if needed
    return true;
});

// Stage channel - for stage display screen
Broadcast::channel('stage', function () {
    // Public channel for stage display
    return true;
});

// Admin channel - for admin control panel
Broadcast::channel('admin', function ($user) {
    // Only authenticated admins can join admin channel
    return $user && $user->is_admin ?? false;
});
