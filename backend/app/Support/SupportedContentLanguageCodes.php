<?php

namespace App\Support;

final class SupportedContentLanguageCodes
{
    /** @var list<string> */
    public const CODES = [
        'vi',
        'en',
        'ja',
        'ko',
        'zh-cn',
        'th',
        'id',
        'es',
        'fr',
        'de',
    ];

    public static function normalize(string $code): string
    {
        return strtolower(trim($code));
    }

    public static function isSupported(string $code): bool
    {
        $normalized = self::normalize($code);

        return $normalized !== '' && in_array($normalized, self::CODES, true);
    }
}
