<?php

namespace App\Events;

use App\Models\Game;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class WaitingScreenRevealed implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(public readonly Game $game) {}

    public function broadcastOn(): array
    {
        return [
            new Channel('game.' . $this->game->id),
            new Channel('stage'),
            new PrivateChannel('admin'),
        ];
    }

    public function broadcastAs(): string
    {
        return 'screen.revealed';
    }

    public function broadcastWith(): array
    {
        return ['game_id' => $this->game->id];
    }
}
