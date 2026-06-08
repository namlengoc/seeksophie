<?php

namespace App\Support;

use Illuminate\Support\Collection;

class ArticleImages
{
    /**
     * @param  array<int, string|array{path: string, filename?: string}>|null  $imagePaths
     * @return Collection<int, array{path: string, filename: string, stored_name: string, index: int}>
     */
    public static function normalize(?array $imagePaths): Collection
    {
        return collect($imagePaths ?? [])->values()->map(function ($item, int $index) {
            if (is_string($item)) {
                $path = $item;
                $storedName = basename($path);

                return [
                    'path' => $path,
                    'filename' => $storedName,
                    'stored_name' => $storedName,
                    'index' => $index,
                ];
            }

            $path = $item['path'] ?? '';
            $storedName = basename($path);

            return [
                'path' => $path,
                'filename' => $item['filename'] ?? $storedName,
                'stored_name' => $storedName,
                'index' => $index,
            ];
        });
    }

    /**
     * @return array<int, array{index: int, filename: string, stored_name: string, url: string}>
     */
    public static function forApi(int $articleId, ?array $imagePaths): array
    {
        return self::normalize($imagePaths)
            ->map(fn (array $image) => [
                'index' => $image['index'],
                'filename' => $image['filename'],
                'stored_name' => $image['stored_name'],
                'url' => url("/api/v1/articles/{$articleId}/images/{$image['index']}"),
            ])
            ->values()
            ->all();
    }
}
