<?php

namespace App\Events;

use App\Models\RoundQuestion;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class QuestionClosed implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public RoundQuestion $roundQuestion,
        public array $questionData
    ) {}

    public function broadcastOn(): array
    {
        return [
            new Channel('game.' . $this->roundQuestion->round->game_id),
            new Channel('stage'),
            new Channel('admin'),
        ];
    }

    public function broadcastAs(): string
    {
        return 'question.closed';
    }

    public function broadcastWith(): array
    {
        return [
            'round_question_id' => $this->roundQuestion->id,
            'game_id'           => $this->roundQuestion->round->game_id,
            'question'          => $this->questionData,
        ];
    }
}
