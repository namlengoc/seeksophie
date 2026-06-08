<?php

namespace App\Jobs;

use App\Enums\ArticleStatus;
use App\Models\Article;
use App\Services\AiServiceClient;
use App\Support\ArticleImages;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Throwable;

class ProcessArticleJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;

    public int $timeout = 300;

    public function __construct(public int $articleId)
    {
        $this->onQueue('ai-processing');
    }

    public function handle(AiServiceClient $aiService): void
    {
        $article = Article::findOrFail($this->articleId);

        $article->update([
            'status' => ArticleStatus::Processing,
            'error_message' => null,
        ]);

        $documentPath = Storage::disk('local')->path($article->document_path);

        if (! file_exists($documentPath)) {
            throw new \RuntimeException("Document not found: {$article->document_path}");
        }

        $images = ArticleImages::normalize($article->image_paths)
            ->map(fn (array $image) => [
                'path' => Storage::disk('local')->path($image['path']),
                'filename' => $image['filename'],
                'stored_name' => $image['stored_name'],
            ])
            ->filter(fn (array $image) => file_exists($image['path']))
            ->values()
            ->all();

        $documentFilename = basename((string) $article->document_path);
        if (! str_ends_with(strtolower($documentFilename), '.docx')) {
            $documentFilename = pathinfo($documentFilename, PATHINFO_FILENAME).'.docx';
        }

        $result = $aiService->processDocument(
            $documentPath,
            $images,
            $article->source_lang ?? 'en',
            $documentFilename
        );

        $extracted = $result['extracted_data'] ?? [];
        $extracted = $this->mapSuggestedImagesToStoredNames($extracted, $images);

        $article->update([
            'title' => $extracted['title'] ?? $article->title,
            'raw_content_json' => $result['raw_content'] ?? null,
            'extracted_data_json' => $extracted ?: null,
            'status' => ArticleStatus::Draft,
            'error_message' => null,
        ]);
    }

    /**
     * Map AI suggested original filenames to stored names for stable image URLs.
     *
     * @param  array<string, mixed>  $extracted
     * @param  array<int, array{path: string, filename: string, stored_name: string}>  $images
     * @return array<string, mixed>
     */
    private function mapSuggestedImagesToStoredNames(array $extracted, array $images): array
    {
        $lookup = [];
        foreach ($images as $image) {
            $lookup[$image['filename']] = $image['stored_name'];
            $lookup[$image['stored_name']] = $image['stored_name'];
        }

        if (! isset($extracted['sections']) || ! is_array($extracted['sections'])) {
            return $extracted;
        }

        $extracted['sections'] = array_map(function (array $section) use ($lookup) {
            if (! isset($section['suggested_images']) || ! is_array($section['suggested_images'])) {
                return $section;
            }

            $section['suggested_images'] = array_values(array_filter(array_map(
                fn (string $name) => $lookup[$name] ?? $name,
                $section['suggested_images']
            )));

            return $section;
        }, $extracted['sections']);

        return $extracted;
    }

    public function failed(?Throwable $exception): void
    {
        Log::error('ProcessArticleJob failed', [
            'article_id' => $this->articleId,
            'message' => $exception?->getMessage(),
        ]);

        Article::whereKey($this->articleId)->update([
            'status' => ArticleStatus::Failed,
            'error_message' => $exception?->getMessage() ?? 'Unknown processing error',
        ]);
    }
}
