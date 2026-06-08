<?php

namespace App\Policies;

use App\Models\Article;
use App\Models\User;

class ArticlePolicy
{
    public function view(User $user, Article $article): bool
    {
        return $user->canManageAllArticles() || $user->id === $article->user_id;
    }

    public function update(User $user, Article $article): bool
    {
        return $user->canManageAllArticles() || $user->id === $article->user_id;
    }

    public function upload(User $user): bool
    {
        return true;
    }
}
