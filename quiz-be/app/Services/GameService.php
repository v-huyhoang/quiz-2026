<?php

namespace App\Services;

use App\Models\Answer;
use App\Models\Game;
use App\Models\Question;
use App\Models\Round;
use App\Models\RoundQuestion;
use App\Models\Submission;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Redis;

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

        $this->presenceAdd($game->id, $team->id, $team->name);
        $this->invalidatePublicState($game->id);

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
        return Cache::remember("game:state:public:{$id}", 30, fn () =>
            $this->buildState(Game::findOrFail($id), isAdmin: false)
        );
    }

    public function getAdminState(int $id): array
    {
        return $this->buildState(Game::findOrFail($id), isAdmin: true);
    }

    public function invalidatePublicState(int $gameId): void
    {
        Cache::forget("game:state:public:{$gameId}");
    }

    // ── Redis presence helpers ────────────────────────────────────────────────

    private function presenceKey(int $gameId): string
    {
        return "game:presence:{$gameId}";
    }

    public function presenceAdd(int $gameId, int $teamId, string $teamName): void
    {
        Redis::hset($this->presenceKey($gameId), $teamId, $teamName);
        Redis::expire($this->presenceKey($gameId), 86400);
    }

    public function presenceRemove(int $gameId, int $teamId): void
    {
        Redis::hdel($this->presenceKey($gameId), $teamId);
    }

    private function getPresenceTeams(int $gameId): ?array
    {
        $raw = Redis::hgetall($this->presenceKey($gameId));
        if (empty($raw)) {
            return null;
        }
        return collect($raw)->map(fn ($name, $id) => ['id' => (int) $id, 'name' => $name])->values()->all();
    }

    private function buildState(Game $game, bool $isAdmin): array
    {
        $redisTeams = $this->getPresenceTeams($game->id);
        $teams = $redisTeams !== null
            ? collect($redisTeams)
            : $game->teams()->where('is_present', true)->get(['id', 'name']);

        $activeRound = $game->rounds()
            ->whereIn('status', ['active', 'finished'])
            ->orderByRaw("CASE WHEN status = 'active' THEN 1 WHEN status = 'finished' THEN 2 END")
            ->orderByDesc('round_number')
            ->first();
        $currentRound = null;

        if ($activeRound) {

            $questionsDone = RoundQuestion::where('round_id', $activeRound->id)
                ->where('status', 'closed')
                ->count();

            $totalQuestions = RoundQuestion::where('round_id', $activeRound->id)
                ->count() ?: $game->questions_per_round;

            $currentQuestion = null;

            if ($activeRound->status === 'active') {

                $currentRQ = RoundQuestion::where('round_id', $activeRound->id)
                    ->where('status', 'open')
                    ->first()
                    ?? RoundQuestion::where('round_id', $activeRound->id)
                        ->where('status', 'closed')
                        ->orderByDesc('closed_at')
                        ->first();

                if ($currentRQ) {
                    $question = $currentRQ->question()
                        ->with('answers')
                        ->firstOrFail();

                    $revealCorrect = $isAdmin || $currentRQ->status === 'closed';

                    $currentQuestion = [
                        'round_question_id' => $currentRQ->id,
                        'order_number' => $currentRQ->order_number,
                        'content' => $question->content,
                        'status' => $currentRQ->status,
                        'opened_at' => $currentRQ->opened_at?->toISOString(),
                        'time_limit_seconds' => $question->time_limit_seconds,
                        'answers' => $question->answers->map(fn($a) => [
                            'id' => $a->id,
                            'content' => $a->content,
                            'is_correct' => $revealCorrect ? (bool) $a->is_correct : null,
                        ])->all(),
                    ];

                    if ($isAdmin) {
                        $subs = Submission::where('round_question_id', $currentRQ->id)->get();
                        $submittedIds = $subs->pluck('team_id')->all();

                        $currentQuestion['team_submissions'] = $teams->map(fn($t) => [
                            'team_id' => $t->id,
                            'team_name' => $t->name,
                            'submitted' => in_array($t->id, $submittedIds),
                            'is_correct' => $subs->firstWhere('team_id', $t->id)?->is_correct,
                        ])->all();
                    }
                }
            }

            $currentRound = [
                'round_number' => $activeRound->round_number,
                'status' => $activeRound->status,
                'questions_done' => $questionsDone,
                'total_questions' => $totalQuestions,
                'current_question' => $currentQuestion,
            ];
        }

        return [
            'status'              => $game->status,
            'name'                => $game->name,
            'access_code'         => $game->access_code,
            'rounds_total'        => $game->rounds,
            'questions_per_round' => $game->questions_per_round,
            'teams'               => $teams->map(fn($t) => ['id' => $t->id, 'name' => $t->name])->all(),
            'current_round'       => $currentRound,
        ];
    }

    // ── Leaderboard ───────────────────────────────────────────────────────────

    public function getLeaderboard(int $id): array
    {
        Game::findOrFail($id);

        $rows = DB::table('teams as t')
            ->leftJoin('submissions as s', 's.team_id', '=', 't.id')
            ->where('t.game_id', $id)
            ->select(
                't.id as team_id',
                't.name as team_name',
                DB::raw('SUM(CASE WHEN s.is_correct = 1 THEN 1 ELSE 0 END) as correct_count'),
                DB::raw('SUM(CASE WHEN s.is_correct = 1 THEN s.response_time_ms ELSE 0 END) as total_time_ms')
            )
            ->groupBy('t.id', 't.name')
            ->orderByDesc('correct_count')
            ->orderBy('total_time_ms')
            ->get();

        return $rows->values()->map(fn ($r, $i) => [
            'rank'               => $i + 1,
            'team_id'            => $r->team_id,
            'team_name'          => $r->team_name,
            'correct_count'      => (int) $r->correct_count,
            'total_time_seconds' => round($r->total_time_ms / 1000, 2),
        ])->all();
    }

    // ── Player: submit answer ─────────────────────────────────────────────────

    public function submitAnswer(int $teamId, int $rqId, int $answerId, ?int $clientResponseTimeMs = null): bool
    {
        $isCorrect = false;

        DB::transaction(function () use ($teamId, $rqId, $answerId, $clientResponseTimeMs, &$isCorrect) {
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
            // Use client-provided time when available; fall back to server-side calculation
            $ms = $clientResponseTimeMs ?? ($rq->opened_at ? now()->diffInMilliseconds($rq->opened_at) : 0);
            $isCorrect = (bool) $answer->is_correct;

            Submission::create([
                'team_id'           => $teamId,
                'round_question_id' => $rqId,
                'answer_id'         => $answerId,
                'is_correct'        => $isCorrect,
                'response_time_ms'  => $ms,
            ]);
        });

        return $isCorrect;
    }

    // ── Admin: game lifecycle ─────────────────────────────────────────────────

    public function startGame(int $gameId): Game
    {
        $game = Game::findOrFail($gameId);

        if ($game->status !== 'pending') {
            throw new \Exception('Game is not in pending status');
        }

        $game->update(['status' => 'active', 'started_at' => now()]);
        $this->invalidatePublicState($gameId);
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
        $this->invalidatePublicState($gameId);
    }

    public function openNextQuestion(int $gameId): RoundQuestion
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
        $this->invalidatePublicState($gameId);

        return $rq->load(['question.answers', 'round']);
    }

    public function closeCurrentQuestion(int $gameId): RoundQuestion
    {
        $round = Game::findOrFail($gameId)->rounds()->where('status', 'active')->firstOrFail();

        $rq = RoundQuestion::where('round_id', $round->id)
            ->where('status', 'open')
            ->firstOrFail();

        $rq->update(['status' => 'closed', 'closed_at' => now()]);
        $this->invalidatePublicState($gameId);

        return $rq->load(['question.answers', 'round']);
    }

    public function finishCurrentRound(int $gameId): Round
    {
        $round = Game::findOrFail($gameId)->rounds()->where('status', 'active')->firstOrFail();
        $round->update(['status' => 'finished', 'ended_at' => now()]);
        $this->invalidatePublicState($gameId);
        return $round;
    }

    public function finishGame(int $gameId): void
    {
        $game = Game::findOrFail($gameId);

        if ($game->status !== 'active') {
            throw new \Exception('Game is not active');
        }

        $game->update(['status' => 'finished', 'ended_at' => now()]);
        $this->invalidatePublicState($gameId);
    }

    // ── Round results ─────────────────────────────────────────────────────────

    public function getRoundResults(int $id): array
    {
        $game = Game::findOrFail($id);

        return $game->rounds()->orderBy('round_number')->get()->map(function (Round $round) {
            $topTeams = DB::table('submissions as s')
                ->join('round_questions as rq', 's.round_question_id', '=', 'rq.id')
                ->join('teams as t', 's.team_id', '=', 't.id')
                ->select(
                    't.id as team_id',
                    't.name as team_name',
                    DB::raw('SUM(s.is_correct) as correct_count'),
                    DB::raw('SUM(CASE WHEN s.is_correct = 1 THEN s.response_time_ms ELSE 0 END) as total_time_ms')
                )
                ->where('rq.round_id', $round->id)
                ->groupBy('t.id', 't.name')
                ->orderByDesc('correct_count')
                ->orderBy('total_time_ms')
                ->limit(20)
                ->get()
                ->values()
                ->map(fn($entry, $i) => [
                    'rank'               => $i + 1,
                    'team_id'            => $entry->team_id,
                    'team_name'          => $entry->team_name,
                    'correct_count'      => (int) $entry->correct_count,
                    'total_time_seconds' => round($entry->total_time_ms / 1000, 2),
                ])
                ->all();

            return [
                'round_number' => $round->round_number,
                'top_teams'    => $topTeams,
            ];
        })->all();
    }

    // ── Legacy compatibility ──────────────────────────────────────────────────

    public function getActiveGame(): ?Game
    {
        return Game::where('status', 'active')->first();
    }

    public function getCurrentQuestion(int $gameId): ?RoundQuestion
    {
        return RoundQuestion::whereHas('round', fn($q) => $q->where('game_id', $gameId)->where('status', 'active'))
            ->where('status', 'open')
            ->orderBy('order_number')
            ->first();
    }
}
