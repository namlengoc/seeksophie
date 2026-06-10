<?php

namespace App\Exceptions;

use Exception;

class DocumentUnsuitableException extends Exception
{
    /**
     * @param  array<int, array{index: int, text: string}>|null  $rawContent
     */
    public function __construct(
        string $message,
        public readonly ?array $rawContent = null,
    ) {
        parent::__construct($message);
    }
}
