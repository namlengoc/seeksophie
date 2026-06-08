<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class DetectDocumentLanguageRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'document' => ['required', 'file', 'mimes:docx', 'max:20480'],
        ];
    }
}
