<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Support\SocialOAuthUserLinker;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Laravel\Socialite\Facades\Socialite;

class SocialAuthController extends Controller
{
    private const PROVIDERS = ['google'];

    public function redirectToProvider(Request $request, string $provider): RedirectResponse
    {
        $normalized = strtolower(trim($provider));

        if (! in_array($normalized, self::PROVIDERS, true)) {
            abort(422, 'Unsupported social provider.');
        }

        if (! $this->credentialsConfigured($normalized)) {
            abort(503, 'Social login is not configured for this provider.');
        }

        try {
            $driver = Socialite::driver($normalized)->stateless();
            $resumeState = $this->buildResumeState($request);

            if ($resumeState !== null) {
                $driver = $driver->with(['state' => $resumeState]);
            }

            return $driver->redirect();
        } catch (\Throwable $e) {
            Log::warning('Social OAuth redirect failed.', [
                'provider' => $normalized,
                'message' => $e->getMessage(),
            ]);
            abort(503, 'Social login is temporarily unavailable.');
        }
    }

    public function handleProviderCallback(Request $request, string $provider, SocialOAuthUserLinker $linker): RedirectResponse
    {
        $normalized = strtolower(trim($provider));

        if (! in_array($normalized, self::PROVIDERS, true)) {
            abort(422, 'Unsupported social provider.');
        }

        $frontend = rtrim((string) config('services.frontend_app_url', ''), '/');
        if ($frontend === '') {
            abort(500, 'Frontend callback URL is not configured.');
        }

        try {
            $oauthUser = Socialite::driver($normalized)->stateless()->user();
        } catch (\Throwable $e) {
            Log::warning('Social OAuth callback failed.', [
                'provider' => $normalized,
                'message' => $e->getMessage(),
            ]);

            return redirect()->away($frontend.'/login?social_oauth_error=callback_failed');
        }

        try {
            $user = $linker->linkOrCreateUser($oauthUser, $normalized);
        } catch (\InvalidArgumentException $e) {
            return redirect()->away($frontend.'/login?social_oauth_error=invalid_profile');
        } catch (\Throwable $e) {
            Log::error('Social user link failed.', [
                'provider' => $normalized,
                'message' => $e->getMessage(),
            ]);

            return redirect()->away($frontend.'/login?social_oauth_error=link_failed');
        }

        $plainToken = $user->createToken('api-token')->plainTextToken;

        $query = ['token' => $plainToken];
        $resume = $this->pullResumePayload($request);
        if (isset($resume['article_id'])) {
            $query['article_id'] = $resume['article_id'];
        }
        if (isset($resume['next'])) {
            $query['next'] = $resume['next'];
        }
        if (isset($resume['guest_token'])) {
            $query['guest_token'] = $resume['guest_token'];
        }

        return redirect()->away($frontend.'/social-oauth-complete?'.http_build_query($query));
    }

    private function buildResumeState(Request $request): ?string
    {
        $payload = [];

        $articleId = $request->query('article_id');
        if (is_numeric($articleId)) {
            $payload['article_id'] = (int) $articleId;
        }

        $next = trim((string) $request->query('next', ''));
        if ($next !== '' && str_starts_with($next, '/') && ! str_starts_with($next, '//')) {
            $payload['next'] = $next;
        }

        $guestToken = trim((string) $request->query('guest_token', ''));
        if ($guestToken !== '') {
            $payload['guest_token'] = $guestToken;
        }

        if ($payload === []) {
            return null;
        }

        $state = Str::random(40);
        Cache::put("social_oauth_resume:{$state}", $payload, now()->addMinutes(15));

        return $state;
    }

    /** @return array<string, mixed> */
    private function pullResumePayload(Request $request): array
    {
        $state = trim((string) $request->query('state', ''));
        if ($state === '') {
            return [];
        }

        $cached = Cache::pull("social_oauth_resume:{$state}");

        return is_array($cached) ? $cached : [];
    }

    private function credentialsConfigured(string $provider): bool
    {
        if ($provider !== 'google') {
            return false;
        }

        $id = (string) config('services.google.client_id', '');
        $secret = (string) config('services.google.client_secret', '');

        return $id !== '' && $secret !== '';
    }
}
