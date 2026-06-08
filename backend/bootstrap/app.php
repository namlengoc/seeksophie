<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Support\Facades\Route;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
        apiPrefix: 'api',
        then: function () {
            // API root — no web middleware (avoids cookie encryption / APP_KEY on GET /)
            Route::get('/', function () {
                return response()->json([
                    'service' => 'Seek Sophie API',
                    'health' => url('/up'),
                    'api' => url('/api/v1'),
                ]);
            });
        },
    )
    ->withMiddleware(function (Middleware $middleware) {
        // Caddy/Cloudflare terminate TLS; backend sees HTTP on :8800
        $middleware->trustProxies(at: '*');
    })
    ->withExceptions(function (Exceptions $exceptions) {
        //
    })->create();
