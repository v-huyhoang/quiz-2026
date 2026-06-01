<?php

namespace Database\Seeders;

use App\Models\Game;
use App\Models\Question;
use App\Models\Round;
use App\Models\RoundQuestion;
use App\Models\Submission;
use App\Models\Team;
use Illuminate\Database\Seeder;

class FinishedGameSeeder extends Seeder
{
    public function run(): void
    {
        $questions = Question::with('answers')->get();

        if ($questions->count() < 15) {
            $this->command->warn('FinishedGameSeeder: need at least 15 questions — run QuestionSeeder first.');
            return;
        }

        $game = Game::updateOrCreate(
            ['access_code' => 'DONE01'],
            [
                'name'                => 'Championship Quiz 2026',
                'rounds'              => 3,
                'questions_per_round' => 5,
                'question_mode'       => 'manual',
                'status'              => 'finished',
            ]
        );

        $teamNames = ['Quantum Hawks', 'Solar Flares', 'Thunder Bolts', 'Iron Coders'];
        $teams = [];
        foreach ($teamNames as $name) {
            $teams[] = Team::updateOrCreate(
                ['game_id' => $game->id, 'name' => $name],
                ['is_present' => true]
            );
        }

        // Which questions each team answers correctly per round (5 questions per round)
        $correctMasks = [
            // Quantum Hawks: dominant overall
            [[true, true, true, true, true], [true, true, true, true, false], [true, true, true, true, true]],
            // Solar Flares: wins round 2
            [[true, true, true, true, false], [true, true, true, true, true], [true, true, true, false, false]],
            // Thunder Bolts: middling
            [[true, true, true, false, false], [true, true, true, false, false], [true, true, true, true, false]],
            // Iron Coders: struggling
            [[true, true, false, false, false], [true, true, false, false, false], [true, true, false, false, false]],
        ];

        // Response times in ms per team per round per question
        $responseTimes = [
            [[3200, 2800, 4100, 3500, 2900], [5200, 4800, 3700, 6100,  7000], [2800, 3100, 4200, 3800, 3500]],
            [[6100, 7200, 5800, 8300, 9100], [4200, 3800, 5100, 4700,  3200], [8200, 7100, 9800, 11000, 10200]],
            [[9800, 11200, 8900, 12000, 14000], [10200, 9800, 11500, 13200, 14100], [7200, 8800, 9400, 10200, 12000]],
            [[15000, 18000, 20000, 17000, 19000], [14000, 16000, 22000, 20000, 18000], [13000, 15000, 21000, 23000, 19000]],
        ];

        $baseTime = now()->subHour();

        for ($roundNum = 1; $roundNum <= 3; $roundNum++) {
            $roundStart = $baseTime->copy()->addMinutes(($roundNum - 1) * 18);

            $round = Round::updateOrCreate(
                ['game_id' => $game->id, 'round_number' => $roundNum],
                ['status' => 'finished', 'started_at' => $roundStart, 'ended_at' => $roundStart->copy()->addMinutes(15)]
            );

            $roundQuestions = $questions->slice(($roundNum - 1) * 5, 5)->values();
            $rqModels = [];

            foreach ($roundQuestions as $idx => $question) {
                $openedAt = $roundStart->copy()->addMinutes($idx * 2 + 1);
                $rqModels[$idx] = RoundQuestion::updateOrCreate(
                    ['round_id' => $round->id, 'question_id' => $question->id],
                    [
                        'order_number' => $idx + 1,
                        'status'       => 'closed',
                        'opened_at'    => $openedAt,
                        'closed_at'    => $openedAt->copy()->addSeconds(30),
                    ]
                );
            }

            foreach ($teams as $teamIdx => $team) {
                foreach ($roundQuestions as $qIdx => $question) {
                    $rq = $rqModels[$qIdx];
                    $isCorrect = $correctMasks[$teamIdx][$roundNum - 1][$qIdx];

                    $answer = $isCorrect
                        ? $question->answers->firstWhere('is_correct', true)
                        : $question->answers->firstWhere('is_correct', false);

                    if (!$answer) {
                        continue;
                    }

                    Submission::updateOrCreate(
                        ['team_id' => $team->id, 'round_question_id' => $rq->id],
                        [
                            'answer_id'        => $answer->id,
                            'is_correct'       => $isCorrect,
                            'response_time_ms' => $responseTimes[$teamIdx][$roundNum - 1][$qIdx],
                        ]
                    );
                }
            }
        }

        $this->command->info("FinishedGameSeeder: created game '{$game->name}' (code: DONE01) with 3 rounds and 4 teams.");
    }
}
