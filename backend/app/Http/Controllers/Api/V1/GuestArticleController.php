<?php

namespace App\Http\Controllers\Api\V1;

use App\Enums\ArticleStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\DetectDocumentLanguageRequest;
use App\Http\Requests\GuestUploadArticleRequest;
use App\Jobs\ProcessArticleJob;
use App\Models\Article;
use App\Services\AiLanguageDetectClient;
use App\Support\SupportedContentLanguageCodes;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Storage;

class GuestArticleController extends Controller
{
    public function __construct(private readonly AiLanguageDetectClient $languageDetectClient) {}

    public function detectLanguage(DetectDocumentLanguageRequest $request): JsonResponse
    {
        $path = $request->file('document')->getRealPath();
        if ($path === false) {
            return response()->json(['message' => 'Invalid upload'], 422);
        }

        $detectResult = $this->languageDetectClient->detectDocument(
            $path,
            $request->file('document')->getClientOriginalName()
        );
        $detected = SupportedContentLanguageCodes::normalize($detectResult['lang']);

        return response()->json([
            'detected_lang' => $detected,
            'confidence' => $detectResult['confidence'],
            'is_reliable' => $detectResult['is_reliable'],
            'is_supported' => SupportedContentLanguageCodes::isSupported($detected),
        ]);
    }

    public function upload(GuestUploadArticleRequest $request): JsonResponse
    {
        $guestToken = $request->string('guest_token')->toString();
        $sourceLang = SupportedContentLanguageCodes::normalize($request->string('source_lang')->toString());

        $documentPath = $request->file('document')->store('documents', 'local');

        $imageManifest = [];
        if ($request->hasFile('images')) {
            foreach ($request->file('images') as $image) {
                $path = $image->store('images', 'local');
                $imageManifest[] = [
                    'path' => $path,
                    'filename' => $image->getClientOriginalName(),
                ];
            }
        }

        $article = Article::create([
            'user_id' => null,
            'guest_token' => $guestToken,
            'title' => pathinfo($request->file('document')->getClientOriginalName(), PATHINFO_FILENAME),
            'source_lang' => $sourceLang,
            'status' => ArticleStatus::Pending,
            'document_path' => $documentPath,
            'image_paths' => $imageManifest ?: null,
        ]);

        ProcessArticleJob::dispatch($article->id);

        return response()->json([
            'id' => $article->id,
            'guest_token' => $guestToken,
            'source_lang' => $article->source_lang,
            'status' => $article->status->value,
            'message' => 'Article queued for processing',
        ], 202);
    }

    public function status(string $guestToken, int $id): JsonResponse
    {
        $article = Article::query()
            ->whereKey($id)
            ->where('guest_token', $guestToken)
            ->whereNull('user_id')
            ->firstOrFail();

        return response()->json([
            'id' => $article->id,
            'status' => $article->status->value,
            'title' => $article->title,
            'error_message' => $article->error_message,
            'requires_auth' => $article->status === ArticleStatus::Draft,
            'updated_at' => $article->updated_at?->toIso8601String(),
        ]);
    }
}
