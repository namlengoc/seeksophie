<?php

namespace App\Support;

use App\Enums\UserRole;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Laravel\Socialite\Contracts\User as SocialOAuthUserContract;

final class SocialOAuthUserLinker
{
    public function linkOrCreateUser(SocialOAuthUserContract $oauthUser, string $providerKey): User
    {
        $providerId = (string) $oauthUser->getId();
        if ($providerId === '') {
            throw new \InvalidArgumentException('Social provider did not return a user id.');
        }

        $email = Str::lower(trim((string) $oauthUser->getEmail()));
        if ($email === '') {
            $email = sprintf('%s_%s@social.local', $providerKey, $providerId);
        }

        $name = trim((string) $oauthUser->getName());
        if ($name === '') {
            $nickname = trim((string) $oauthUser->getNickname());
            $name = $nickname !== '' ? $nickname : 'Seek Sophie User';
        }

        $existingByProvider = User::query()
            ->where('provider', $providerKey)
            ->where('provider_id', $providerId)
            ->first();

        if ($existingByProvider !== null) {
            $existingByProvider->fill([
                'name' => $name,
                'email' => $email,
            ])->save();

            return $existingByProvider;
        }

        $existingByEmail = User::query()->where('email', $email)->first();
        if ($existingByEmail !== null) {
            $existingByEmail->fill([
                'name' => $name,
                'provider' => $providerKey,
                'provider_id' => $providerId,
            ])->save();

            return $existingByEmail;
        }

        return User::query()->create([
            'name' => $name,
            'email' => $email,
            'password' => Hash::make(Str::password(32)),
            'role' => UserRole::Author,
            'provider' => $providerKey,
            'provider_id' => $providerId,
        ]);
    }
}
