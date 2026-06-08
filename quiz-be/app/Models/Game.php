<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Game extends Model
{
    /** @use HasFactory<\Database\Factories\GameFactory> */
    use HasFactory;

    protected $fillable = [
        'name',
        'status',
        'started_at',
        'ended_at',
        'access_code',
        'rounds',
        'questions_per_round',
        'question_mode',
        'max_teams',
    ];

    protected $casts = [
        'started_at' => 'datetime',
        'ended_at' => 'datetime',
    ];

    public function rounds()
    {
        return $this->hasMany(Round::class);
    }

    public function teams()
    {
        return $this->hasMany(Team::class);
    }
}
