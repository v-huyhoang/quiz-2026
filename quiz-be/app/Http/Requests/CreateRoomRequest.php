<?php
namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class CreateRoomRequest extends FormRequest
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
            'name'                             => 'required|string|max:255',
            'rounds'                           => 'required|integer|min:1|max:10',
            'questions_per_round'              => 'required|integer|min:1|max:20',
            'access_code'                      => 'required|string|max:10|unique:games,access_code',
            'question_mode'                    => 'required|in:random,manual',
            'round_questions'                  => 'nullable|array',
            'round_questions.*.round_number'   => 'required|integer',
            'round_questions.*.question_ids'   => 'required|array',
            'round_questions.*.question_ids.*' => 'exists:questions,id',
        ];
    }

    /**
     * Get custom attributes for validator errors.
     *
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return [
            'round_questions.*.round_number' => 'round number',
            'round_questions.*.question_ids' => 'question ids',
        ];
    }
}
