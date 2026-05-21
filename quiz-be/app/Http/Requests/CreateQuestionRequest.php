<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class CreateQuestionRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'text' => 'required|string',
            'totalTime' => 'required|integer|min:5|max:300',
            'options' => 'required|array|size:4',
            'options.*.text' => 'required|string',
            'options.*.isCorrect' => 'required|boolean',
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator) {
            $correctAnswers = collect($this->input('options', []))
                ->filter(fn ($option) => is_array($option) && (bool) ($option['isCorrect'] ?? false))
                ->count();

            if ($correctAnswers !== 1) {
                $validator->errors()->add('options', 'Question must have exactly one correct answer.');
            }
        });
    }
}
