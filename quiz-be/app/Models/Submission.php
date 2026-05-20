<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Submission extends Model
{
    /** @use HasFactory<\Database\Factories\SubmissionFactory> */
    use HasFactory;

    protected $fillable = ['round_question_id', 'team_id', 'answer_id', 'is_correct', 'response_time_ms'];

    public function roundQuestion()
    {
        return $this->belongsTo(RoundQuestion::class);
    }
}
