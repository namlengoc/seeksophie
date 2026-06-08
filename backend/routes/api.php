<?php

use App\Http\Controllers\Api\V1\ArticleController;
use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\GuestArticleController;
use App\Http\Controllers\Api\V1\SocialAuthController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {
    Route::post('/auth/register', [AuthController::class, 'register']);
    Route::post('/auth/login', [AuthController::class, 'login']);

    Route::get('/auth/social/{provider}/redirect', [SocialAuthController::class, 'redirectToProvider'])
        ->where('provider', 'google');
    Route::get('/auth/social/{provider}/callback', [SocialAuthController::class, 'handleProviderCallback'])
        ->where('provider', 'google');

    Route::post('/guest/articles/detect-language', [GuestArticleController::class, 'detectLanguage']);
    Route::post('/guest/articles/upload', [GuestArticleController::class, 'upload']);
    Route::get('/guest/articles/{guestToken}/{id}/status', [GuestArticleController::class, 'status']);

    Route::middleware('auth:sanctum')->group(function () {
        Route::get('/auth/me', [AuthController::class, 'me']);
        Route::post('/auth/logout', [AuthController::class, 'logout']);

        Route::get('/articles', [ArticleController::class, 'index']);
        Route::post('/articles/detect-language', [ArticleController::class, 'detectLanguage']);
        Route::post('/articles/upload', [ArticleController::class, 'upload']);
        Route::post('/articles/{id}/claim', [ArticleController::class, 'claim']);
        Route::get('/articles/{id}/status', [ArticleController::class, 'status']);
        Route::get('/articles/{id}', [ArticleController::class, 'show']);
        Route::get('/articles/{id}/images/{index}', [ArticleController::class, 'image'])->whereNumber('index');
        Route::put('/articles/{id}', [ArticleController::class, 'update']);
    });
});
