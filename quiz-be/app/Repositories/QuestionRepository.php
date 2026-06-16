<?php

namespace App\Repositories;

use App\Models\Question;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class QuestionRepository
{
    public function paginateWithAnswers(int $perPage, ?string $search = null): LengthAwarePaginator
    {
        return Question::with('answers')
            ->when($search, fn($query) => $query->where('content', 'like', '%' . $search . '%'))
            ->orderBy('created_at', 'desc')
            ->paginate($perPage);
    }

    public function createWithAnswers(array $data): Question
    {
        $question = Question::create([
            'content' => $data['text'],
            'time_limit_seconds' => $data['totalTime'],
            'type' => 'single_choice',
        ]);

        foreach ($data['options'] as $option) {
            $question->answers()->create([
                'content' => $option['text'],
                'is_correct' => $option['isCorrect'],
            ]);
        }

        return $question->load('answers');
    }

    public function createManyWithAnswers(array $questions): int
    {
        foreach ($questions as $questionData) {
            $this->createWithAnswers($questionData);
        }

        return count($questions);
    }

    public function deleteById(string $id): void
    {
        Question::findOrFail($id)->delete();
    }
}
