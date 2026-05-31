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
            'round_question_id' => 'required|integer',
            'answer_id'         => 'required|integer',
            'response_time_ms'  => 'nullable|integer|min:0',
        ];
    }
}
