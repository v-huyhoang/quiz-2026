<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Round extends Model
{
    /** @use HasFactory<\Database\Factories\RoundFactory> */
    use HasFactory;

    protected $fillable = ['game_id', 'round_number', 'status', 'started_at', 'ended_at'];

    public function game(): BelongsTo
    {
        return $this->belongsTo(Game::class);
    }

    public function questions()
    {
        return $this->belongsToMany(Question::class, 'round_questions')
                    ->withPivot('id', 'order_number', 'status', 'opened_at', 'closed_at')
                    ->withTimestamps();
    }
}
