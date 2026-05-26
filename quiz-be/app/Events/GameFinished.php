<?php

namespace App\Events;

use App\Models\Game;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class GameFinished implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(public Game $game) {}

    public function broadcastOn(): array
    {
        return [
            new Channel('game.' . $this->game->id),
            new Channel('stage'),
            new Channel('admin'),
        ];
    }

    public function broadcastAs(): string
    {
        return 'game.finished';
    }

    public function broadcastWith(): array
    {
        return [
            'game_id' => $this->game->id,
            'status'  => $this->game->status,
        ];
    }
}
