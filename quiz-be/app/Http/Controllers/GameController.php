<?php

namespace App\Http\Controllers;

use App\Events\GameFinished;
use App\Events\GameStarted;
use App\Events\QuestionClosed;
use App\Events\QuestionStarted;
use App\Events\RoundFinished;
use App\Events\TeamJoined;
use App\Models\Game;
use App\Services\GameService;
use App\Traits\ApiResponseTrait;
use Illuminate\Http\Request;

class GameController extends Controller
{
    use ApiResponseTrait;

    public function __construct(private readonly GameService $gameService) {}

    public function index()
    {
        $games = Game::latest()->get()->map(fn ($g) => [
            'id'                  => $g->id,
            'name'                => $g->name,
            'access_code'         => $g->access_code,
            'rounds'              => $g->rounds,
            'questions_per_round' => $g->questions_per_round,
            'question_mode'       => $g->question_mode,
            'status'              => $g->status,
        ]);

        return $this->successResponse($games->values()->all());
    }

    public function join(string $code, Request $request)
    {
        $request->validate(['team_name' => 'required|string|max:255']);

        try {
            $data = $this->gameService->joinGame($code, $request->team_name);
            broadcast(new TeamJoined($data['game_id'], ['id' => $data['team_id'], 'name' => $data['team_name']]));
            return $this->successResponse($data, 'Joined successfully');
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage(), null, 422);
        }
    }

    public function publicState(int $id)
    {
        try {
            return $this->successResponse($this->gameService->getPublicState($id));
        } catch (\Exception $e) {
            return $this->resourceNotFoundResponse('Game not found');
        }
    }

    public function leaderboard(int $id)
    {
        try {
            return $this->successResponse($this->gameService->getLeaderboard($id));
        } catch (\Exception $e) {
            return $this->resourceNotFoundResponse('Game not found');
        }
    }

    public function submitAnswer(Request $request)
    {
        $request->validate([
            'round_question_id' => 'required|integer|exists:round_questions,id',
            'answer_id'         => 'required|integer|exists:answers,id',
        ]);

        $team = $request->user();

        try {
            $this->gameService->submitAnswer($team->id, $request->round_question_id, $request->answer_id);
            return $this->successResponse(null, 'Answer submitted');
        } catch (\Exception $e) {
            $status = str_contains($e->getMessage(), 'Already') ? 409 : 422;
            return $this->errorResponse($e->getMessage(), null, $status);
        }
    }

    public function adminState(int $id)
    {
        try {
            return $this->successResponse($this->gameService->getAdminState($id));
        } catch (\Exception $e) {
            return $this->resourceNotFoundResponse('Game not found');
        }
    }

    public function start(int $id)
    {
        try {
            $game = $this->gameService->startGame($id);
            broadcast(new GameStarted($game));
            return $this->successResponse($this->gameService->getAdminState($id), 'Game started');
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage(), null, 422);
        }
    }

    public function startRound(int $id)
    {
        try {
            $this->gameService->startNextRound($id);
            return $this->successResponse($this->gameService->getAdminState($id), 'Round started');
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage(), null, 422);
        }
    }

    public function openQuestion(int $id)
    {
        try {
            $rq = $this->gameService->openNextQuestion($id);

            $questionData = [
                'id'                 => $rq->question->id,
                'content'            => $rq->question->content,
                'time_limit_seconds' => $rq->question->time_limit_seconds,
                'answers'            => $rq->question->answers->map(fn ($a) => [
                    'id'         => $a->id,
                    'content'    => $a->content,
                    'is_correct' => null,
                ])->all(),
            ];

            broadcast(new QuestionStarted($rq, $questionData));

            return $this->successResponse($this->gameService->getAdminState($id), 'Question opened');
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage(), null, 422);
        }
    }

    public function closeQuestion(int $id)
    {
        try {
            $rq = $this->gameService->closeCurrentQuestion($id);

            $questionData = [
                'id'                 => $rq->question->id,
                'content'            => $rq->question->content,
                'time_limit_seconds' => $rq->question->time_limit_seconds,
                'answers'            => $rq->question->answers->map(fn ($a) => [
                    'id'         => $a->id,
                    'content'    => $a->content,
                    'is_correct' => (bool) $a->is_correct,
                ])->all(),
            ];

            broadcast(new QuestionClosed($rq, $questionData));

            return $this->successResponse($this->gameService->getAdminState($id), 'Question closed');
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage(), null, 422);
        }
    }

    public function finishRound(int $id)
    {
        try {
            $round = $this->gameService->finishCurrentRound($id);
            broadcast(new RoundFinished($id, $round->round_number));
            return $this->successResponse($this->gameService->getAdminState($id), 'Round finished');
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage(), null, 422);
        }
    }

    public function finish(int $id)
    {
        try {
            $this->gameService->finishGame($id);
            $game = Game::findOrFail($id);
            broadcast(new GameFinished($game));
            return $this->successResponse($this->gameService->getAdminState($id), 'Game finished');
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage(), null, 422);
        }
    }

    // Legacy methods kept for compatibility
    public function getActive()
    {
        $game = $this->gameService->getActiveGame();
        return $this->successResponse($game);
    }

    public function getCurrentQuestion(Request $request)
    {
        $request->validate(['game_id' => 'required|integer|exists:games,id']);
        $rq = $this->gameService->getCurrentQuestion($request->game_id);
        return $this->successResponse($rq);
    }
}
