<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Laravel\Sanctum\HasApiTokens;

class Team extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\TeamFactory> */
    use HasFactory, HasApiTokens;

    protected $fillable = ['game_id', 'name'];

    public function game(): BelongsTo
    {
        return $this->belongsTo(Game::class);
    }

    public function submissions(): HasMany
    {
        return $this->hasMany(Submission::class);
    }
}
