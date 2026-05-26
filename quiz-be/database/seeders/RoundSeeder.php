<?php

namespace Database\Seeders;

use App\Models\Game;
use App\Models\Round;
use Illuminate\Database\Seeder;

class RoundSeeder extends Seeder
{
    public function run(): void
    {
        $game = Game::where('access_code', 'DEMO01')->first();

        if (!$game) {
            return;
        }

        for ($i = 1; $i <= $game->rounds; $i++) {
            Round::updateOrCreate(
                ['game_id' => $game->id, 'round_number' => $i],
                ['status' => 'pending']
            );
        }
    }
}
