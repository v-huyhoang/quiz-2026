<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class GameResult extends Model
{
    /** @use HasFactory<\Database\Factories\GameResultFactory> */
    use HasFactory;

    protected $fillable = ['game_id', 'team_id', 'total_correct_count', 'total_response_time_ms', 'rank', 'is_winner'];
}
