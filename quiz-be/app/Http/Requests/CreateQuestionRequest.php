<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class CreateQuestionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $type = $this->input('type', 'single_choice');

        $base = [
            'type'      => 'required|string|in:single_choice,image_input',
            'totalTime' => 'required|integer|min:5|max:300',
        ];

        if ($type === 'image_input') {
            return array_merge($base, [
                'image'       => 'required|file|image|max:5120',
                'answer_text' => 'required|string|min:1|max:500',
                'text'        => 'nullable|string',
            ]);
        }

        // single_choice (default)
        return array_merge($base, [
            'text'              => 'required|string',
            'options'           => 'required|array|size:4',
            'options.*.text'    => 'required|string',
            'options.*.isCorrect' => 'required|boolean',
        ]);
    }

    public function withValidator(Validator $validator): void
    {
        if ($this->input('type', 'single_choice') !== 'single_choice') {
            return;
        }

        $validator->after(function (Validator $validator) {
            $correctAnswers = collect($this->input('options', []))
                ->filter(fn($option) => is_array($option) && (bool) ($option['isCorrect'] ?? false))
                ->count();

            if ($correctAnswers !== 1) {
                $validator->errors()->add('options', 'Question must have exactly one correct answer.');
            }
        });
    }
}
