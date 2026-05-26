<?php

namespace App\Services;

use App\Models\Answer;
use App\Models\Game;
use App\Models\Question;
use App\Models\RoundQuestion;
use App\Models\Submission;
use Illuminate\Support\Facades\DB;

class GameService
{
    // ── Player: join room ─────────────────────────────────────────────────────

    public function joinGame(string $code, string $teamName): array
    {
        $game = Game::where('access_code', strtoupper($code))->firstOrFail();

        if ($game->status !== 'pending') {
            throw new \Exception('Game is not accepting new players');
        }

        if ($game->teams()->where('name', $teamName)->exists()) {
            throw new \Exception('Team name already taken');
        }

        $team  = $game->teams()->create(['name' => $teamName]);
        $token = $team->createToken('player-token')->plainTextToken;

        return [
            'token'     => $token,
            'team_id'   => $team->id,
            'team_name' => $team->name,
            'game_id'   => $game->id,
            'room'      => [
                'id'          => $game->id,
                'name'        => $game->name,
                'access_code' => $game->access_code,
            ],
        ];
    }

    // ── Game state builders ───────────────────────────────────────────────────

    public function getPublicState(int $id): array
    {
        return $this->buildState(Game::findOrFail($id), isAdmin: false);
    }

    public function getAdminState(int $id): array
    {
        return $this->buildState(Game::findOrFail($id), isAdmin: true);
    }

    private function buildState(Game $game, bool $isAdmin): array
    {
        $teams       = $game->teams()->get(['id', 'name']);
        $activeRound = $game->rounds()->where('status', 'active')->first();
        $currentRound = null;

        if ($activeRound) {
            // Prefer the currently open question; fall back to the last closed one for answer reveal
            $currentRQ = RoundQuestion::where('round_id', $activeRound->id)
                ->where('status', 'open')
                ->first()
                ?? RoundQuestion::where('round_id', $activeRound->id)
                    ->where('status', 'closed')
                    ->orderByDesc('closed_at')
                    ->first();

            $questionsDone  = RoundQuestion::where('round_id', $activeRound->id)->where('status', 'closed')->count();
            $totalQuestions = RoundQuestion::where('round_id', $activeRound->id)->count()
                ?: $game->questions_per_round;

            $currentQuestion = null;
            if ($currentRQ) {
                $question      = $currentRQ->question()->with('answers')->firstOrFail();
                $revealCorrect = $isAdmin || $currentRQ->status === 'closed';

                $currentQuestion = [
                    'round_question_id'  => $currentRQ->id,
                    'order_number'       => $currentRQ->order_number,
                    'content'            => $question->content,
                    'status'             => $currentRQ->status,
                    'opened_at'          => $currentRQ->opened_at?->toISOString(),
                    'time_limit_seconds' => $question->time_limit_seconds,
                    'answers'            => $question->answers->map(fn ($a) => [
                        'id'         => $a->id,
                        'content'    => $a->content,
                        'is_correct' => $revealCorrect ? (bool) $a->is_correct : null,
                    ])->all(),
                ];

                if ($isAdmin) {
                    $subs         = Submission::where('round_question_id', $currentRQ->id)->get();
                    $submittedIds = $subs->pluck('team_id')->all();

                    $currentQuestion['team_submissions'] = $teams->map(fn ($t) => [
                        'team_id'    => $t->id,
                        'team_name'  => $t->name,
                        'submitted'  => in_array($t->id, $submittedIds),
                        'is_correct' => $subs->firstWhere('team_id', $t->id)?->is_correct,
                    ])->all();
                }
            }

            $currentRound = [
                'round_number'     => $activeRound->round_number,
                'status'           => $activeRound->status,
                'questions_done'   => $questionsDone,
                'total_questions'  => $totalQuestions,
                'current_question' => $currentQuestion,
            ];
        }

        return [
            'status'        => $game->status,
            'name'          => $game->name,
            'access_code'   => $game->access_code,
            'rounds_total'  => $game->rounds,
            'teams'         => $teams->map(fn ($t) => ['id' => $t->id, 'name' => $t->name])->all(),
            'current_round' => $currentRound,
        ];
    }

    // ── Leaderboard ───────────────────────────────────────────────────────────

    public function getLeaderboard(int $id): array
    {
        $teams = Game::findOrFail($id)->teams()->get();

        $ranked = $teams->map(function ($team) {
            $subs    = Submission::where('team_id', $team->id)->get();
            $correct = $subs->where('is_correct', true)->count();
            $totalMs = $subs->where('is_correct', true)->sum('response_time_ms');

            return [
                'team_id'            => $team->id,
                'team_name'          => $team->name,
                'correct_count'      => $correct,
                'total_time_seconds' => round($totalMs / 1000, 2),
            ];
        })->sort(function ($a, $b) {
            if ($a['correct_count'] !== $b['correct_count']) {
                return $b['correct_count'] - $a['correct_count'];
            }
            return $a['total_time_seconds'] <=> $b['total_time_seconds'];
        })->values()->map(fn ($entry, $i) => array_merge($entry, ['rank' => $i + 1]))->all();

        return $ranked;
    }

    // ── Player: submit answer ─────────────────────────────────────────────────

    public function submitAnswer(int $teamId, int $rqId, int $answerId): void
    {
        DB::transaction(function () use ($teamId, $rqId, $answerId) {
            $exists = Submission::where('team_id', $teamId)
                ->where('round_question_id', $rqId)
                ->lockForUpdate()
                ->exists();

            if ($exists) {
                throw new \Exception('Already submitted for this question');
            }

            $rq = RoundQuestion::findOrFail($rqId);
            if ($rq->status !== 'open') {
                throw new \Exception('Question is not open');
            }

            $answer = Answer::findOrFail($answerId);
            $ms     = $rq->opened_at ? now()->diffInMilliseconds($rq->opened_at) : 0;

            Submission::create([
                'team_id'           => $teamId,
                'round_question_id' => $rqId,
                'answer_id'         => $answerId,
                'is_correct'        => (bool) $answer->is_correct,
                'response_time_ms'  => $ms,
            ]);
        });
    }

    // ── Admin: game lifecycle ─────────────────────────────────────────────────

    public function startGame(int $gameId): Game
    {
        $game = Game::findOrFail($gameId);

        if ($game->status !== 'pending') {
            throw new \Exception('Game is not in pending status');
        }

        $game->update(['status' => 'active', 'started_at' => now()]);
        return $game->fresh();
    }

    public function startNextRound(int $gameId): void
    {
        $game = Game::findOrFail($gameId);

        if ($game->status !== 'active') {
            throw new \Exception('Game is not active');
        }

        if ($game->rounds()->where('status', 'active')->exists()) {
            throw new \Exception('A round is already active');
        }

        $round = $game->rounds()->where('status', 'pending')->orderBy('round_number')->firstOrFail();

        if ($game->question_mode === 'random' && !RoundQuestion::where('round_id', $round->id)->exists()) {
            $questions = Question::inRandomOrder()->limit($game->questions_per_round)->get();
            foreach ($questions as $index => $question) {
                RoundQuestion::create([
                    'round_id'     => $round->id,
                    'question_id'  => $question->id,
                    'order_number' => $index + 1,
                    'status'       => 'pending',
                ]);
            }
        }

        $round->update(['status' => 'active', 'started_at' => now()]);
    }

    public function openNextQuestion(int $gameId): void
    {
        $round = Game::findOrFail($gameId)->rounds()->where('status', 'active')->firstOrFail();

        if (RoundQuestion::where('round_id', $round->id)->where('status', 'open')->exists()) {
            throw new \Exception('A question is already open');
        }

        $rq = RoundQuestion::where('round_id', $round->id)
            ->where('status', 'pending')
            ->orderBy('order_number')
            ->firstOrFail();

        $rq->update(['status' => 'open', 'opened_at' => now()]);
    }

    public function closeCurrentQuestion(int $gameId): void
    {
        $round = Game::findOrFail($gameId)->rounds()->where('status', 'active')->firstOrFail();

        $rq = RoundQuestion::where('round_id', $round->id)
            ->where('status', 'open')
            ->firstOrFail();

        $rq->update(['status' => 'closed', 'closed_at' => now()]);
    }

    public function finishCurrentRound(int $gameId): void
    {
        $round = Game::findOrFail($gameId)->rounds()->where('status', 'active')->firstOrFail();
        $round->update(['status' => 'finished', 'ended_at' => now()]);
    }

    public function finishGame(int $gameId): void
    {
        $game = Game::findOrFail($gameId);

        if ($game->status !== 'active') {
            throw new \Exception('Game is not active');
        }

        $game->update(['status' => 'finished', 'ended_at' => now()]);
    }

    // ── Legacy compatibility ──────────────────────────────────────────────────

    public function getActiveGame(): ?Game
    {
        return Game::where('status', 'active')->first();
    }

    public function getCurrentQuestion(int $gameId): ?RoundQuestion
    {
        return RoundQuestion::whereHas('round', fn ($q) => $q->where('game_id', $gameId)->where('status', 'active'))
            ->where('status', 'open')
            ->orderBy('order_number')
            ->first();
    }
}
