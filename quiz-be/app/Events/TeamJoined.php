<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class TeamJoined implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public int $gameId,
        public array $team
    ) {}

    public function broadcastOn(): array
    {
        return [new Channel('game.' . $this->gameId)];
    }

    public function broadcastAs(): string
    {
        return 'team.joined';
    }

    public function broadcastWith(): array
    {
        return [
            'game_id' => $this->gameId,
            'team'    => $this->team,
        ];
    }
}
