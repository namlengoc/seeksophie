#!/bin/sh
set -e

if [ ! -f .env ]; then
    cp .env.example .env
fi

# Docker env_file overrides .env; fall back to file on disk (bind mount)
if [ -z "$APP_KEY" ] || [ "$APP_KEY" = "base64:" ]; then
    APP_KEY=$(grep -E '^APP_KEY=' .env 2>/dev/null | head -1 | cut -d= -f2- | tr -d '"' | tr -d "'")
    export APP_KEY
fi

if [ -z "$APP_KEY" ] || [ "$APP_KEY" = "base64:" ]; then
    if [ "$APP_ENV" = "production" ]; then
        echo "ERROR: APP_KEY is missing in production."
        echo "Set APP_KEY=\"base64:...\" in backend/.env on the host, then:"
        echo "  docker compose -f docker-compose.prod.yml up -d --force-recreate backend queue-worker"
        exit 1
    fi
    php artisan key:generate --force --no-interaction
fi

php artisan config:clear --no-interaction
if [ "$APP_ENV" = "production" ]; then
    php artisan config:cache --no-interaction
fi
php artisan migrate --force --no-interaction 2>/dev/null || true
php artisan db:seed --force --no-interaction 2>/dev/null || true

exec "$@"
