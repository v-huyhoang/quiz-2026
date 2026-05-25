<?php

namespace App\Http\Controllers;

use App\Services\GameService;
use App\Traits\ApiResponseTrait;
use Illuminate\Http\Request;

class GameController extends Controller
{
    use ApiResponseTrait;

    public function __construct(
        private readonly GameService $gameService
    ) {
    }

    public function start(Request $request)
    {
        $request->validate([
            'game_id' => 'required|integer|exists:games,id',
        ]);

        try {
            $game = $this->gameService->startGame($request->game_id);

            return $this->successResponse(
                $game,
                'Game started successfully'
            );
        } catch (\Exception $e) {
            return $this->errorResponse('Failed to start game: ' . $e->getMessage());
        }
    }

    public function getActive()
    {
        try {
            $game = $this->gameService->getActiveGame();

            if (!$game) {
                return $this->successResponse(null, 'No active game found');
            }

            return $this->successResponse($game, 'Active game retrieved successfully');
        } catch (\Exception $e) {
            return $this->errorResponse('Failed to get active game: ' . $e->getMessage());
        }
    }

    public function getCurrentQuestion(Request $request)
    {
        $request->validate([
            'game_id' => 'required|integer|exists:games,id',
        ]);

        try {
            $roundQuestion = $this->gameService->getCurrentQuestion($request->game_id);

            if (!$roundQuestion) {
                return $this->successResponse(null, 'No current question found');
            }

            return $this->successResponse($roundQuestion, 'Current question retrieved successfully');
        } catch (\Exception $e) {
            return $this->errorResponse('Failed to get current question: ' . $e->getMessage());
        }
    }
}
