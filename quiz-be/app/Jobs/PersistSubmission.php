<?php

namespace App\Jobs;

use App\Models\Submission;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

class PersistSubmission implements ShouldQueue
{
    use Queueable;

    public int $tries = 3;

    public function __construct(
        public readonly int  $teamId,
        public readonly int  $rqId,
        public readonly int  $answerId,
        public readonly bool $isCorrect,
        public readonly int  $responseTimeMs,
    ) {}

    public function handle(): void
    {
        // Idempotent — skip if already persisted (e.g. job retried after partial failure)
        if (Submission::where('team_id', $this->teamId)->where('round_question_id', $this->rqId)->exists()) {
            return;
        }

        Submission::create([
            'team_id'           => $this->teamId,
            'round_question_id' => $this->rqId,
            'answer_id'         => $this->answerId,
            'is_correct'        => $this->isCorrect,
            'response_time_ms'  => $this->responseTimeMs,
        ]);
    }
}
