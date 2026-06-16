<?php

namespace App\Services;

use App\Models\Question;
use App\Repositories\QuestionRepository;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class QuestionService
{
    public function __construct(
        private readonly QuestionRepository $questionRepository
    ) {
    }

    public function paginate(int $perPage, ?string $search = null): array
    {
        $paginator = $this->questionRepository->paginateWithAnswers($perPage, $search);

        return [
            'data' => $paginator
                ->getCollection()
                ->map(fn(Question $question) => $this->formatQuestion($question))
                ->values()
                ->all(),
            'meta' => [
                'currentPage' => $paginator->currentPage(),
                'from'        => $paginator->firstItem(),
                'lastPage'    => $paginator->lastPage(),
                'perPage'     => $paginator->perPage(),
                'to'          => $paginator->lastItem(),
                'total'       => $paginator->total(),
            ],
        ];
    }

    public function create(array $data): array
    {
        $question = DB::transaction(function () use ($data) {
            if (($data['type'] ?? 'single_choice') === 'image_input') {
                return $this->createImageInputQuestion($data);
            }

            return $this->questionRepository->createWithAnswers($data);
        });

        return $this->formatQuestion($question->load('answers'));
    }

    public function delete(string $id): void
    {
        $question = Question::findOrFail($id);

        if ($question->image_path) {
            Storage::disk('public')->delete($question->image_path);
        }

        $this->questionRepository->deleteById($id);
    }

    private function createImageInputQuestion(array $data): Question
    {
        $imagePath = $data['image']->store('question-images', 'public');

        $question = Question::create([
            'type'               => 'image_input',
            'content'            => $data['answer_text'], // Use answer_text as title/content to avoid NULL error
            'image_path'         => $imagePath,
            'time_limit_seconds' => $data['totalTime'],
        ]);

        $question->answers()->create([
            'content'    => $data['answer_text'],
            'is_correct' => true,
        ]);

        return $question;
    }

    private function formatQuestion(Question $question): array
    {
        return [
            'id'       => (string) $question->id,
            'type'     => $question->type,
            'text'     => $question->content,
            'imageUrl' => $question->image_path
                ? Storage::disk('public')->url($question->image_path)
                : null,
            'totalTime' => $question->time_limit_seconds,
            'options'   => $question->type === 'single_choice'
                ? $question->answers->map(fn($answer) => [
                    'id'        => (string) $answer->id,
                    'text'      => $answer->content,
                    'isCorrect' => (bool) $answer->is_correct,
                ])->values()->all()
                : [],
            'answerText' => $question->type === 'image_input'
                ? ($question->answers->firstWhere('is_correct', true)?->content ?? null)
                : null,
        ];
    }
}
