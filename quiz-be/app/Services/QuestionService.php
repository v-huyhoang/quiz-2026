<?php

namespace App\Services;

use App\Models\Question;
use App\Repositories\QuestionRepository;
use Illuminate\Support\Facades\DB;

class QuestionService
{
    public function __construct(
        private readonly QuestionRepository $questionRepository
    ) {
    }

    public function paginate(int $perPage): array
    {
        $paginator = $this->questionRepository->paginateWithAnswers($perPage);

        return [
            'data' => $paginator
                ->getCollection()
                ->map(fn (Question $question) => $this->formatQuestion($question))
                ->values()
                ->all(),
            'meta' => [
                'currentPage' => $paginator->currentPage(),
                'from' => $paginator->firstItem(),
                'lastPage' => $paginator->lastPage(),
                'perPage' => $paginator->perPage(),
                'to' => $paginator->lastItem(),
                'total' => $paginator->total(),
            ],
        ];
    }

    public function create(array $data): array
    {
        $question = DB::transaction(function () use ($data) {
            return $this->questionRepository->createWithAnswers($data);
        });

        return $this->formatQuestion($question);
    }

    public function delete(string $id): void
    {
        $this->questionRepository->deleteById($id);
    }

    private function formatQuestion(Question $question): array
    {
        return [
            'id' => (string) $question->id,
            'text' => $question->content,
            'totalTime' => $question->time_limit_seconds,
            'options' => $question->answers->map(function ($answer) {
                return [
                    'id' => (string) $answer->id,
                    'text' => $answer->content,
                    'isCorrect' => (bool) $answer->is_correct,
                ];
            }),
        ];
    }
}
