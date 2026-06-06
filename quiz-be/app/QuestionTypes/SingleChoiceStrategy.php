<?php

namespace App\QuestionTypes;

use App\Models\Answer;
use App\Models\Question;

class SingleChoiceStrategy implements QuestionTypeStrategyInterface
{
    public function evaluate(array $submittedData, Question $question): bool
    {
        $answerId = $submittedData['answer_id'] ?? null;
        if (!$answerId) {
            return false;
        }

        $answer = Answer::where('id', $answerId)
            ->where('question_id', $question->id)
            ->first();

        return $answer ? (bool) $answer->is_correct : false;
    }
}
