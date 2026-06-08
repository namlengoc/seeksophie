<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\ClaimGuestArticleRequest;
use App\Http\Requests\DetectDocumentLanguageRequest;
use App\Http\Requests\UpdateArticleRequest;
use App\Http\Requests\UploadArticleRequest;
use App\Jobs\ProcessArticleJob;
use App\Models\Article;
use App\Enums\ArticleStatus;
use App\Services\AiLanguageDetectClient;
use App\Support\ArticleImages;
use App\Support\SupportedContentLanguageCodes;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class ArticleController extends Controller
{
    public function __construct(private readonly AiLanguageDetectClient $languageDetectClient) {}

    private function findAccessibleArticle(Request $request, int $id): Article
    {
        $query = Article::query();

        if (! $request->user()->canManageAllArticles()) {
            $query->where('user_id', $request->user()->id);
        }

        return $query->findOrFail($id);
    }

    public function detectLanguage(DetectDocumentLanguageRequest $request): JsonResponse
    {
        $this->authorize('upload', Article::class);

        $path = $request->file('document')->getRealPath();
        if ($path === false) {
            return response()->json(['message' => 'Invalid upload'], 422);
        }

        $detectResult = $this->languageDetectClient->detectDocument(
            $path,
            $request->file('document')->getClientOriginalName()
        );
        $detected = SupportedContentLanguageCodes::normalize($detectResult['lang']);
        $isSupported = SupportedContentLanguageCodes::isSupported($detected);

        return response()->json([
            'detected_lang' => $detected,
            'confidence' => $detectResult['confidence'],
            'is_reliable' => $detectResult['is_reliable'],
            'is_supported' => $isSupported,
        ]);
    }

    public function upload(UploadArticleRequest $request): JsonResponse
    {
        $this->authorize('upload', Article::class);

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
            'user_id' => $request->user()->id,
            'title' => pathinfo($request->file('document')->getClientOriginalName(), PATHINFO_FILENAME),
            'source_lang' => $sourceLang,
            'status' => ArticleStatus::Pending,
            'document_path' => $documentPath,
            'image_paths' => $imageManifest ?: null,
        ]);

        ProcessArticleJob::dispatch($article->id);

        return response()->json([
            'id' => $article->id,
            'source_lang' => $article->source_lang,
            'status' => $article->status->value,
            'message' => 'Article queued for processing',
        ], 202);
    }

    public function status(Request $request, int $id): JsonResponse
    {
        $article = $this->findAccessibleArticle($request, $id);

        return response()->json([
            'id' => $article->id,
            'status' => $article->status->value,
            'title' => $article->title,
            'error_message' => $article->error_message,
            'updated_at' => $article->updated_at?->toIso8601String(),
        ]);
    }

    public function show(Request $request, int $id): JsonResponse
    {
        $article = $this->findAccessibleArticle($request, $id);

        return response()->json([
            'id' => $article->id,
            'user_id' => $article->user_id,
            'title' => $article->title,
            'source_lang' => $article->source_lang,
            'status' => $article->status->value,
            'raw_content_json' => $article->raw_content_json,
            'extracted_data_json' => $article->extracted_data_json,
            'images' => ArticleImages::forApi($article->id, $article->image_paths),
            'error_message' => $article->error_message,
            'created_at' => $article->created_at?->toIso8601String(),
            'updated_at' => $article->updated_at?->toIso8601String(),
        ]);
    }

    public function image(Request $request, int $id, int $index)
    {
        $article = $this->findAccessibleArticle($request, $id);
        $image = ArticleImages::normalize($article->image_paths)->get($index);

        if (! $image) {
            abort(404);
        }

        $absolutePath = Storage::disk('local')->path($image['path']);

        if (! file_exists($absolutePath)) {
            abort(404);
        }

        return response()->file($absolutePath);
    }

    public function update(UpdateArticleRequest $request, int $id): JsonResponse
    {
        $article = $this->findAccessibleArticle($request, $id);

        $this->authorize('update', $article);

        $article->fill($request->validated());
        $article->save();

        return response()->json([
            'id' => $article->id,
            'title' => $article->title,
            'source_lang' => $article->source_lang,
            'status' => $article->status->value,
            'extracted_data_json' => $article->extracted_data_json,
            'updated_at' => $article->updated_at?->toIso8601String(),
        ]);
    }

    public function claim(ClaimGuestArticleRequest $request, int $id): JsonResponse
    {
        $guestToken = $request->string('guest_token')->toString();

        $article = Article::query()
            ->whereKey($id)
            ->where('guest_token', $guestToken)
            ->whereNull('user_id')
            ->firstOrFail();

        $article->update([
            'user_id' => $request->user()->id,
            'guest_token' => null,
        ]);

        return response()->json([
            'id' => $article->id,
            'message' => 'Article claimed successfully',
        ]);
    }

    public function index(Request $request): JsonResponse
    {
        $query = Article::query()->latest();

        if (! $request->user()->canManageAllArticles()) {
            $query->where('user_id', $request->user()->id);
        }

        $articles = $query->get(['id', 'user_id', 'title', 'status', 'created_at', 'updated_at']);

        return response()->json([
            'data' => $articles->map(fn (Article $article) => [
                'id' => $article->id,
                'user_id' => $article->user_id,
                'title' => $article->title,
                'status' => $article->status->value,
                'created_at' => $article->created_at?->toIso8601String(),
                'updated_at' => $article->updated_at?->toIso8601String(),
            ]),
        ]);
    }
}
