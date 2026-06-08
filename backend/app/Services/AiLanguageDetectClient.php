<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use RuntimeException;

class AiLanguageDetectClient
{
    /**
     * @return array{lang: string, confidence: float, is_reliable: bool}
     */
    public function detectText(string $text): array
    {
        $baseUrl = rtrim(config('services.ai_service.url'), '/');

        $response = Http::timeout(15)
            ->post("{$baseUrl}/v1/detect-language", [
                'text' => $text,
            ]);

        if ($response->failed()) {
            Log::error('Language detect request failed', [
                'status' => $response->status(),
                'body' => $response->body(),
            ]);

            throw new RuntimeException('Language detection service unavailable.');
        }

        $payload = $response->json();
        if (! is_array($payload) || ! isset($payload['lang'])) {
            throw new RuntimeException('Language detect returned invalid JSON.');
        }

        return [
            'lang' => (string) $payload['lang'],
            'confidence' => (float) ($payload['confidence'] ?? 0),
            'is_reliable' => (bool) ($payload['is_reliable'] ?? false),
        ];
    }

    /**
     * @return array{lang: string, confidence: float, is_reliable: bool}
     */
    public function detectDocument(string $documentPath, ?string $originalFilename = null): array
    {
        $baseUrl = rtrim(config('services.ai_service.url'), '/');
        $filename = $originalFilename ?: basename($documentPath);
        if (! str_ends_with(strtolower($filename), '.docx')) {
            $filename = pathinfo($filename, PATHINFO_FILENAME).'.docx';
        }

        $contents = file_get_contents($documentPath);
        if ($contents === false) {
            throw new RuntimeException('Unable to read uploaded document.');
        }

        $response = Http::timeout(30)
            ->connectTimeout(5)
            ->attach(
                'document',
                $contents,
                $filename,
                ['Content-Type' => 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
            )
            ->post("{$baseUrl}/v1/detect-document-language");

        if ($response->failed()) {
            Log::error('Document language detect failed', [
                'status' => $response->status(),
                'body' => $response->body(),
            ]);

            throw new RuntimeException('Document language detection failed.');
        }

        $payload = $response->json();
        if (! is_array($payload) || ! isset($payload['lang'])) {
            throw new RuntimeException('Document language detect returned invalid JSON.');
        }

        return [
            'lang' => (string) $payload['lang'],
            'confidence' => (float) ($payload['confidence'] ?? 0),
            'is_reliable' => (bool) ($payload['is_reliable'] ?? false),
        ];
    }
}
