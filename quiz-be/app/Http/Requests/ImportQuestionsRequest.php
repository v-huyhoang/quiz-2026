<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
class ImportQuestionsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'file' => 'required|file|mimes:csv,txt,xlsx|max:5120',
        ];
    }

    public function messages(): array
    {
        return [
            'file.mimes' => 'The import file must be a CSV or Excel XLSX file.',
        ];
    }
}
