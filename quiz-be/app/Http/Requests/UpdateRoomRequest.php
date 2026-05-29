<?php
namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class UpdateRoomRequest extends FormRequest
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
            'name'                             => 'sometimes|string|max:255',
            'round_questions'                  => 'sometimes|array',
            'round_questions.*.round_number'   => 'required_with:round_questions|integer',
            'round_questions.*.question_ids'   => 'required_with:round_questions|array',
            'round_questions.*.question_ids.*' => 'required_with:round_questions|exists:questions,id',
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
