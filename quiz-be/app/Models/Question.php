<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Question extends Model
{
    /** @use HasFactory<\Database\Factories\QuestionFactory> */
    use HasFactory;

    protected $fillable = ['round_id', 'content', 'type', 'order_number', 'time_limit_seconds', 'status', 'opened_at', 'closed_at'];
}
