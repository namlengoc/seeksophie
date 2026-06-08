<?php

namespace App\Providers;

use App\Models\Article;
use App\Policies\ArticlePolicy;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        Gate::policy(Article::class, ArticlePolicy::class);

        $root = rtrim((string) config('app.url'), '/');
        if ($root !== '') {
            URL::forceRootUrl($root);
            if (str_starts_with($root, 'https://')) {
                URL::forceScheme('https');
            }
        }
    }
}
