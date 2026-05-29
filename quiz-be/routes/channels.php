<?php

use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});

// Game channel - public broadcast events (questions, game state, etc.)
Broadcast::channel('game.{gameId}', function ($user, $gameId) {
    return true;
});

// Presence channel - tracks which teams are currently connected
Broadcast::channel('presence-game.{gameId}', function ($team, $gameId) {
    if ((int) $team->game_id !== (int) $gameId) return false;
    return ['id' => $team->id, 'name' => $team->name];
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
