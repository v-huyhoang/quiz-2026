<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

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
            'options' => 'required|array|min:2|max:6',
            'options.*.text' => 'required|string',
            'options.*.isCorrect' => 'required|boolean',
        ];
    }
}
