<?php

namespace App\Http\Controllers;

use App\Events\TeamJoined;
use App\Events\TeamLeft;
use Illuminate\Http\Request;

class ReverbWebhookController extends Controller
{
    public function handle(Request $request)
    {
        foreach ($request->input('events', []) as $event) {
            $channel  = $event['channel'] ?? '';
            $name     = $event['name'] ?? '';
            $userInfo = $event['user_info'] ?? null;

            if (!str_starts_with($channel, 'presence-game.') || !$userInfo) {
                continue;
            }

            $gameId   = (int) substr($channel, strlen('presence-game.'));
            $teamData = ['id' => (int) $userInfo['id'], 'name' => $userInfo['name']];

            match ($name) {
                'member_removed' => broadcast(new TeamLeft($gameId, $teamData)),
                'member_added'   => broadcast(new TeamJoined($gameId, $teamData)),
                default          => null,
            };
        }

        return response()->json(['ok' => true]);
    }
}
