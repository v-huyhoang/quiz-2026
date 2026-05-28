<?php

namespace Database\Seeders;

use App\Models\Game;
use App\Models\Team;
use Illuminate\Database\Seeder;

class TeamSeeder extends Seeder
{
    public function run(): void
    {
        $game = Game::where('access_code', 'DEMO01')->first();

        if (!$game) {
            return;
        }

        $names = [
            'Alpha Team',
            'Neon Knights',
            'Cyber Punks',
            'Data Miners',
        ];

        foreach ($names as $name) {
            Team::updateOrCreate(
                ['game_id' => $game->id, 'name' => $name],
                []
            );
        }
    }
}
