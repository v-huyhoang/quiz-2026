<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Question extends Model
{
    /** @use HasFactory<\Database\Factories\QuestionFactory> */
    use HasFactory;

    protected $fillable = ['content', 'type', 'image_path', 'time_limit_seconds'];

    public function answers()
    {
        return $this->hasMany(Answer::class);
    }

    public function rounds()
    {
        return $this->belongsToMany(Round::class, 'round_questions')
                    ->withPivot('id', 'order_number', 'status', 'opened_at', 'closed_at')
                    ->withTimestamps();
    }
}
