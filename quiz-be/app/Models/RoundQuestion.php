<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\Pivot;

class RoundQuestion extends Pivot
{
    protected $table = 'round_questions';
    
    public $incrementing = true;

    protected $fillable = ['round_id', 'question_id', 'order_number', 'status', 'opened_at', 'closed_at'];

    public function round()
    {
        return $this->belongsTo(Round::class);
    }

    public function question()
    {
        return $this->belongsTo(Question::class);
    }

    public function submissions()
    {
        return $this->hasMany(Submission::class);
    }
}
