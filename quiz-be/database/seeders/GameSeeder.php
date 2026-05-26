<?php

namespace Database\Seeders;

use App\Models\Game;
use Illuminate\Database\Seeder;

class GameSeeder extends Seeder
{
    public function run(): void
    {
        Game::updateOrCreate(
            ['access_code' => 'DEMO01'],
            [
                'name'                => 'Demo Quiz 2026',
                'rounds'              => 3,
                'questions_per_round' => 5,
                'question_mode'       => 'random',
                'status'              => 'pending',
            ]
        );
    }
}
