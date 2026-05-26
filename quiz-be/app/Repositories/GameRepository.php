<?php

namespace App\Repositories;

use App\Models\Game;
use App\Models\Question;
use App\Models\Round;
use App\Models\RoundQuestion;
use App\Models\Team;
use Illuminate\Database\Eloquent\Collection;

class GameRepository
{
    public function all(): Collection
    {
        return Game::withCount('teams')->latest()->get();
    }

    public function create(array $data): Game
    {
        return Game::create($data);
    }

    public function findByAccessCode(string $code): ?Game
    {
        return Game::where('access_code', $code)->first();
    }

    public function findOrFail(int $id): Game
    {
        return Game::findOrFail($id);
    }

    public function teamExistsInGame(Game $game, string $teamName): bool
    {
        return $game->teams()->where('name', $teamName)->exists();
    }

    public function createTeam(Game $game, string $teamName): Team
    {
        return $game->teams()->create(['name' => $teamName]);
    }

    public function getActiveRound(Game $game): ?Round
    {
        return $game->rounds()->where('status', 'active')->first();
    }

    public function getPendingRound(Game $game): ?Round
    {
        return $game->rounds()->where('status', 'pending')->orderBy('round_number')->first();
    }

    public function getOpenQuestion(Round $round): ?RoundQuestion
    {
        return RoundQuestion::where('round_id', $round->id)
            ->where('status', 'open')
            ->first();
    }

    public function getLastClosedQuestion(Round $round): ?RoundQuestion
    {
        return RoundQuestion::where('round_id', $round->id)
            ->where('status', 'closed')
            ->orderByDesc('closed_at')
            ->first();
    }

    public function getNextPendingQuestion(Round $round): ?RoundQuestion
    {
        return RoundQuestion::where('round_id', $round->id)
            ->where('status', 'pending')
            ->orderBy('order_number')
            ->first();
    }

    public function getRoundQuestionCount(Round $round): int
    {
        return RoundQuestion::where('round_id', $round->id)->count();
    }

    public function getClosedQuestionCount(Round $round): int
    {
        return RoundQuestion::where('round_id', $round->id)->where('status', 'closed')->count();
    }

    public function getRandomQuestions(int $count): Collection
    {
        return Question::inRandomOrder()->limit($count)->get();
    }

    public function createRoundQuestions(Round $round, Collection $questions): void
    {
        foreach ($questions as $index => $question) {
            RoundQuestion::create([
                'round_id'     => $round->id,
                'question_id'  => $question->id,
                'order_number' => $index + 1,
                'status'       => 'pending',
            ]);
        }
    }
}
