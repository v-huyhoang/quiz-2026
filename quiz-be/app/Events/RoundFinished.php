<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class RoundFinished implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public int $gameId,
        public int $roundNumber
    ) {}

    public function broadcastOn(): array
    {
        return [
            new Channel('game.' . $this->gameId),
            new Channel('stage'),
            new Channel('admin'),
        ];
    }

    public function broadcastAs(): string
    {
        return 'round.finished';
    }

    public function broadcastWith(): array
    {
        return [
            'game_id'      => $this->gameId,
            'round_number' => $this->roundNumber,
        ];
    }
}
