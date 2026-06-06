<?php

namespace App\QuestionTypes;

use App\Models\Question;

interface QuestionTypeStrategyInterface
{
    public function evaluate(array $submittedData, Question $question): bool;
}
