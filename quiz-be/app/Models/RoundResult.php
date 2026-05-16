<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class RoundResult extends Model
{
    /** @use HasFactory<\Database\Factories\RoundResultFactory> */
    use HasFactory;

    protected $fillable = ['round_id', 'team_id', 'correct_count', 'total_response_time_ms', 'rank'];
}
