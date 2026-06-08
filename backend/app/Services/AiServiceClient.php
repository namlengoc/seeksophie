<?php

namespace App\Services;

use Illuminate\Http\Client\RequestException;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class AiServiceClient
{
    /**
     * @param  array<int, array{path: string, filename: string, stored_name?: string}>  $images
     */
    public function processDocument(
        string $documentPath,
        array $images = [],
        string $sourceLang = 'en',
        ?string $documentFilename = null,
    ): array {
        $baseUrl = rtrim(config('services.ai_service.url'), '/');
        $filename = $documentFilename ?: basename($documentPath);
        if (! str_ends_with(strtolower($filename), '.docx')) {
            $filename = pathinfo($filename, PATHINFO_FILENAME).'.docx';
        }

        $documentContents = file_get_contents($documentPath);
        if ($documentContents === false) {
            throw new \RuntimeException('Unable to read document for AI processing.');
        }

        $request = Http::timeout(300)
            ->connectTimeout(5)
            ->attach(
                'document',
                $documentContents,
                $filename,
                ['Content-Type' => 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
            );

        foreach ($images as $image) {
            $path = $image['path'];
            if (! file_exists($path)) {
                continue;
            }

            $request = $request->attach(
                'images',
                file_get_contents($path),
                $image['filename']
            );
        }

        $response = $request->post("{$baseUrl}/v1/process-document", [
            'source_lang' => $sourceLang,
        ]);

        if ($response->failed()) {
            Log::error('AI service request failed', [
                'status' => $response->status(),
                'body' => $response->body(),
            ]);

            throw new RequestException($response);
        }

        return $response->json();
    }
}
