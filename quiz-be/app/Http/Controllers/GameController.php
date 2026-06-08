<?php

namespace App\Http\Controllers;

use App\Enums\HttpStatus;
use App\Events\GameFinished;
use App\Events\GameStarted;
use App\Events\QuestionClosed;
use App\Events\QuestionStarted;
use App\Events\RoundFinished;
use App\Events\TeamJoined;
use App\Events\WaitingScreenRevealed;
use App\Http\Requests\Game\GetCurrentQuestionRequest;
use App\Http\Requests\Game\JoinGameRequest;
use App\Http\Requests\Game\SubmitAnswerRequest;
use App\Models\Game;
use App\Models\RoundQuestion;
use App\Models\Team;
use App\Services\GameService;
use App\Traits\ApiResponseTrait;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

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

    public function join(string $code, JoinGameRequest $request)
    {
        try {
            $data = $this->gameService->joinGame($code, $request->team_name);
            broadcast(new TeamJoined($data['game_id'], ['id' => $data['team_id'], 'name' => $data['team_name']]));
            return $this->successResponse($data, 'Joined successfully');
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage(), null, HttpStatus::UnprocessableEntity->value);
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

    public function playerState(int $id, Request $request)
    {
        $team = $request->user();

        if (! $team instanceof Team || $team->game_id !== $id) {
            return $this->errorResponse('Forbidden', null, 403);
        }

        try {
            return $this->successResponse($this->gameService->getPlayerState($id, $team->id));
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

    public function submitAnswer(SubmitAnswerRequest $request)
    {
        $team = $request->user();

        try {
            $answerPayload = $request->answer_id
                ? ['answer_id' => $request->answer_id]
                : ['text' => $request->text_answer ?? ''];

            $isCorrect = $this->gameService->submitAnswer($team->id, $request->round_question_id, $answerPayload, $request->response_time_ms);
            return $this->successResponse(['is_correct' => $isCorrect], 'Answer submitted');
        } catch (\Exception $e) {
            $status = str_contains($e->getMessage(), 'Already') ? HttpStatus::Conflict->value : HttpStatus::UnprocessableEntity->value;
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

    public function reveal(int $id)
    {
        try {
            $game = Game::findOrFail($id);
            broadcast(new WaitingScreenRevealed($game));
            return $this->successResponse(null, 'Waiting screen revealed');
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage(), null, HttpStatus::UnprocessableEntity->value);
        }
    }

    public function start(int $id)
    {
        try {
            $game = $this->gameService->startGame($id);
            broadcast(new GameStarted($game));
            return $this->successResponse($this->gameService->getAdminState($id), 'Game started');
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage(), null, HttpStatus::UnprocessableEntity->value);
        }
    }

    public function startRound(int $id)
    {
        try {
            $this->gameService->startNextRound($id);
            $rq = $this->gameService->openNextQuestion($id);
            broadcast(new QuestionStarted($rq, $this->buildQuestionData($rq, revealCorrect: false)));
            return $this->successResponse($this->gameService->getAdminState($id), 'Round started');
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage(), null, HttpStatus::UnprocessableEntity->value);
        }
    }

    public function openQuestion(int $id)
    {
        try {
            $rq = $this->gameService->openNextQuestion($id);
            broadcast(new QuestionStarted($rq, $this->buildQuestionData($rq, revealCorrect: false)));
            return $this->successResponse($this->gameService->getAdminState($id), 'Question opened');
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage(), null, HttpStatus::UnprocessableEntity->value);
        }
    }

    public function closeQuestion(int $id)
    {
        try {
            $rq = $this->gameService->closeCurrentQuestion($id);
            broadcast(new QuestionClosed($rq, $this->buildQuestionData($rq, revealCorrect: true)));
            return $this->successResponse($this->gameService->getAdminState($id), 'Question closed');
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage(), null, HttpStatus::UnprocessableEntity->value);
        }
    }

    public function finishRound(int $id)
    {
        try {
            $round = $this->gameService->finishCurrentRound($id);
            broadcast(new RoundFinished($id, $round->round_number));
            return $this->successResponse($this->gameService->getAdminState($id), 'Round finished');
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage(), null, HttpStatus::UnprocessableEntity->value);
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
            return $this->errorResponse($e->getMessage(), null, HttpStatus::UnprocessableEntity->value);
        }
    }

    public function leave(int $id)
    {
        $team = request()->user();
        $team->update(['is_present' => false]);
        broadcast(new \App\Events\TeamLeft($id, ['id' => $team->id, 'name' => $team->name]));
        return $this->successResponse(null, 'Left');
    }

    public function roundResults(int $id)
    {
        try {
            return $this->successResponse($this->gameService->getRoundResults($id));
        } catch (\Exception $e) {
            return $this->resourceNotFoundResponse('Game not found');
        }
    }

    public function announce(int $id)
    {
        $team = request()->user();
        $team->update(['is_present' => true]);
        broadcast(new TeamJoined($id, ['id' => $team->id, 'name' => $team->name]));
        return $this->successResponse(null, 'Announced');
    }

    // Legacy methods kept for compatibility
    public function getActive()
    {
        $game = $this->gameService->getActiveGame();
        return $this->successResponse($game);
    }

    public function getCurrentQuestion(GetCurrentQuestionRequest $request)
    {
        $rq = $this->gameService->getCurrentQuestion($request->game_id);
        return $this->successResponse($rq);
    }

    private function buildQuestionData(RoundQuestion $rq, bool $revealCorrect): array
    {
        $question = $rq->question;

        $answers = $question->type === 'single_choice'
            ? $question->answers->map(fn ($a) => [
                'id'         => $a->id,
                'content'    => $a->content,
                'is_correct' => $revealCorrect ? (bool) $a->is_correct : null,
            ])->all()
            : ($revealCorrect
                ? [['id' => null, 'content' => $question->answers->firstWhere('is_correct', true)?->content, 'is_correct' => true]]
                : []);

        return [
            'id'                 => $question->id,
            'type'               => $question->type,
            'content'            => $question->content,
            'image_url'          => $question->image_path
                ? Storage::disk('public')->url($question->image_path)
                : null,
            'time_limit_seconds' => $question->time_limit_seconds,
            'answers'            => $answers,
        ];
    }
}
