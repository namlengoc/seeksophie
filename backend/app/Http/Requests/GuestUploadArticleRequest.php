<?php

namespace App\Http\Requests;

use App\Support\SupportedContentLanguageCodes;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class GuestUploadArticleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'guest_token' => ['required', 'string', 'min:16', 'max:64'],
            'document' => ['required', 'file', 'mimes:docx', 'max:20480'],
            'source_lang' => ['required', 'string', Rule::in(SupportedContentLanguageCodes::CODES)],
            'images' => ['nullable', 'array', 'max:10'],
            'images.*' => ['file', 'mimes:jpg,jpeg,png,webp', 'max:10240'],
        ];
    }
}
