<?php

namespace App\Repositories;

use App\Models\Game;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class RoomRepository
{
    public function getAll()
    {
        return Game::latest()->get();
    }

    public function paginate(int $perPage): LengthAwarePaginator
    {
        return Game::orderBy('created_at', 'desc')->paginate($perPage);
    }

    public function findById(string $id)
    {
        return Game::with('rounds.roundQuestions.question')->findOrFail($id);
    }

    public function create(array $data): Game
    {
        return Game::create($data);
    }

    public function update(string $id, array $data): Game
    {
        $room = Game::findOrFail($id);
        $room->update($data);
        return $room->fresh();
    }

    public function deleteById(string $id): void
    {
        Game::findOrFail($id)->delete();
    }
}
