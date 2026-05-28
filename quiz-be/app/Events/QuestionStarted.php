<?php

namespace App\Events;

use App\Models\RoundQuestion;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class QuestionStarted implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public RoundQuestion $roundQuestion;
    public array $questionData;

    /**
     * Create a new event instance.
     */
    public function __construct(RoundQuestion $roundQuestion, array $questionData)
    {
        $this->roundQuestion = $roundQuestion;
        $this->questionData = $questionData;
    }

    /**
     * Get the channels the event should broadcast on.
     *
     * @return array<int, Channel>
     */
    public function broadcastOn(): array
    {
        $gameId = $this->roundQuestion->round->game_id;
        
        return [
            new Channel('game.' . $gameId),
            new Channel('stage'),
            new Channel('admin'),
        ];
    }

    /**
     * The event's broadcast name.
     */
    public function broadcastAs(): string
    {
        return 'question.started';
    }

    /**
     * Get the data to broadcast.
     */
    public function broadcastWith(): array
    {
        $round = $this->roundQuestion->round;
        $totalQuestions = \App\Models\RoundQuestion::where('round_id', $round->id)->count();

        return [
            'round_question_id' => $this->roundQuestion->id,
            'round_id' => $this->roundQuestion->round_id,
            'game_id' => $round->game_id,
            'round_number' => $round->round_number,
            'total_questions' => $totalQuestions,
            'order_number' => $this->roundQuestion->order_number,
            'question' => $this->questionData,
            'time_limit_seconds' => $this->questionData['time_limit_seconds'],
        ];
    }
}
