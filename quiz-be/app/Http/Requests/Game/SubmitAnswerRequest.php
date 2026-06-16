<?php

namespace App\Http\Requests\Game;

use Illuminate\Foundation\Http\FormRequest;

class SubmitAnswerRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'round_question_id' => 'required|integer|exists:round_questions,id',
            'answer_id'         => 'nullable|integer|exists:answers,id',
            'text_answer'       => 'nullable|string|max:500',
            'response_time_ms'  => 'nullable|integer|min:0',
        ];
    }
}
