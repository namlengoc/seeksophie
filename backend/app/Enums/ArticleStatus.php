<?php

namespace App\Enums;

enum ArticleStatus: string
{
    case Pending = 'pending';
    case Processing = 'processing';
    case Draft = 'draft';
    case UnderReview = 'under_review';
    case Published = 'published';
    case Failed = 'failed';
}
