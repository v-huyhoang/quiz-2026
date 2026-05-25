<?php

namespace App\Services;

use App\Models\Round;
use App\Models\Game;
use App\Repositories\RoomRepository;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class RoomService
{
    public function __construct(
        private readonly RoomRepository $roomRepository
    ) {
    }

    public function getAll(): array
    {
        $rooms = $this->roomRepository->getAll();
        return [
            'success' => true,
            'data' => $rooms,
        ];
    }

    public function paginate(int $perPage): array
    {
        $paginator = $this->roomRepository->paginate($perPage);

        return [
            'data' => $paginator
                ->getCollection()
                ->map(fn (Game $room) => $room->toArray())
                ->values()
                ->all(),
            'meta' => [
                'currentPage' => $paginator->currentPage(),
                'from' => $paginator->firstItem(),
                'lastPage' => $paginator->lastPage(),
                'perPage' => $paginator->perPage(),
                'to' => $paginator->lastItem(),
                'total' => $paginator->total(),
            ],
        ];
    }

    public function findById(string $id): array
    {
        $room = $this->roomRepository->findById($id);
        return [
            'success' => true,
            'data' => $room,
        ];
    }

    public function create(array $data): array
    {
        return DB::transaction(function () use ($data) {
            // Create game
            $gameData = [
                'name' => $data['name'],
                'access_code' => strtoupper($data['access_code']),
                'rounds' => $data['rounds'],
                'questions_per_round' => $data['questions_per_round'],
                'question_mode' => $data['question_mode'],
                'status' => 'pending',
            ];

            $game = $this->roomRepository->create($gameData);

            // Create rounds
            for ($i = 1; $i <= $data['rounds']; $i++) {
                $round = Round::create([
                    'game_id' => $game->id,
                    'round_number' => $i,
                    'status' => 'pending',
                ]);

                // If manual mode, assign questions to this round
                if ($data['question_mode'] === 'manual' && isset($data['round_questions'])) {
                    $roundQuestions = collect($data['round_questions'])
                        ->firstWhere('round_number', $i);

                    if ($roundQuestions && isset($roundQuestions['question_ids'])) {
                        foreach ($roundQuestions['question_ids'] as $index => $questionId) {
                            $round->questions()->attach($questionId, [
                                'order_number' => $index + 1,
                                'status' => 'pending',
                            ]);
                        }
                    }
                }
            }

            return [
                'success' => true,
                'data' => [
                    'id' => $game->id,
                    'name' => $game->name,
                    'access_code' => $game->access_code,
                    'rounds' => $game->rounds,
                    'questions_per_round' => $game->questions_per_round,
                    'question_mode' => $game->question_mode,
                    'status' => $game->status,
                    'join_url' => url("/join?room={$game->access_code}"),
                ],
            ];
        });
    }

    public function update(string $id, array $data): array
    {
        $room = $this->roomRepository->update($id, $data);
        return [
            'success' => true,
            'data' => $room,
        ];
    }

    public function delete(string $id): array
    {
        $room = $this->roomRepository->findById($id);

        // Prevent deletion if game is active
        if ($room->status === 'active') {
            throw ValidationException::withMessages([
                'status' => ['Cannot delete an active game.'],
            ]);
        }

        $this->roomRepository->deleteById($id);

        return [
            'success' => true,
            'message' => 'Room deleted successfully',
        ];
    }
}
