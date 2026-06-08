#!/bin/sh
set -e

if [ ! -f .env ]; then
    cp .env.example .env
fi

if [ -z "$APP_KEY" ] || [ "$APP_KEY" = "base64:" ]; then
    php artisan key:generate --force --no-interaction 2>/dev/null || true
fi

php artisan config:clear --no-interaction 2>/dev/null || true
php artisan migrate --force --no-interaction 2>/dev/null || true
php artisan db:seed --force --no-interaction 2>/dev/null || true

exec "$@"
