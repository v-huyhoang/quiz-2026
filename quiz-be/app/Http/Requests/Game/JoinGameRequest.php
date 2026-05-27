<?php

namespace App\Http\Requests\Game;

use Illuminate\Foundation\Http\FormRequest;

class JoinGameRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'team_name' => 'required|string|max:255',
        ];
    }
}
