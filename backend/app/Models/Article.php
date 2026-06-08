<?php

namespace App\Models;

use App\Enums\ArticleStatus;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Article extends Model
{
    protected $fillable = [
        'user_id',
        'guest_token',
        'reviewer_id',
        'title',
        'source_lang',
        'status',
        'raw_content_json',
        'extracted_data_json',
        'document_path',
        'image_paths',
        'error_message',
    ];

    protected function casts(): array
    {
        return [
            'status' => ArticleStatus::class,
            'raw_content_json' => 'array',
            'extracted_data_json' => 'array',
            'image_paths' => 'array',
        ];
    }

    public function author(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewer_id');
    }
}
