<?php

namespace App\Services;

use App\Events\GameStarted;
use App\Events\QuestionStarted;
use App\Models\Game;
use App\Models\Round;
use App\Models\RoundQuestion;
use App\Models\Question;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class GameService
{
    public function startGame(int $gameId): Game
    {
        return DB::transaction(function () use ($gameId) {
            $game = Game::findOrFail($gameId);
            
            if ($game->status === 'active') {
                throw new \Exception('Game is already active');
            }

            // Update game status to active
            $game->update([
                'status' => 'active',
                'started_at' => now(),
            ]);

            Log::info('Broadcasting GameStarted event for game ' . $game->id);
            // Broadcast game started event
            broadcast(new GameStarted($game));

            // Start first round
            $this->startFirstRound($game);

            return $game->fresh();
        });
    }

    private function startFirstRound(Game $game): void
    {
        // Get first round of the game
        $round = Round::where('game_id', $game->id)
            ->where('round_number', 1)
            ->first();

        if (!$round) {
            throw new \Exception('No rounds found for this game');
        }

        // Update round status to active
        $round->update([
            'status' => 'active',
            'started_at' => now(),
        ]);

        // Start first question of the round
        $this->startFirstQuestion($round);
    }

    private function startFirstQuestion(Round $round): void
    {
        // Get first question of the round
        $roundQuestion = RoundQuestion::where('round_id', $round->id)
            ->where('order_number', 1)
            ->first();

        if (!$roundQuestion) {
            throw new \Exception('No questions found for this round');
        }

        // Update round question status to open
        $roundQuestion->update([
            'status' => 'open',
            'opened_at' => now(),
        ]);

        // Get question data with answers
        $question = Question::with('answers')->findOrFail($roundQuestion->question_id);

        // Prepare question data for broadcasting (exclude correct answers)
        $questionData = [
            'id' => $question->id,
            'content' => $question->content,
            'type' => $question->type,
            'time_limit_seconds' => $question->time_limit_seconds,
            'answers' => $question->answers->map(function ($answer) {
                return [
                    'id' => $answer->id,
                    'content' => $answer->content,
                ];
            }),
        ];

        // Broadcast question started event
        Log::info('Broadcasting QuestionStarted event for question ' . $question->id . ' in game ' . $round->game_id);
        broadcast(new QuestionStarted($roundQuestion, $questionData));
    }

    public function getActiveGame(): ?Game
    {
        return Game::where('status', 'active')->first();
    }

    public function getCurrentQuestion(int $gameId): ?RoundQuestion
    {
        return RoundQuestion::whereHas('round', function ($query) use ($gameId) {
            $query->where('game_id', $gameId)->where('status', 'active');
        })
        ->where('status', 'open')
        ->orderBy('order_number')
        ->first();
    }
}
