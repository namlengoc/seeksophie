<?php

namespace App\Enums;

enum UserRole: string
{
    case Admin = 'admin';
    case Editor = 'editor';
    case Author = 'author';

    public function isStaff(): bool
    {
        return $this === self::Admin || $this === self::Editor;
    }
}
