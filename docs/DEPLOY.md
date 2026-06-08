# Production Deployment Guide

Deploy Seek Sophie to a VPS with:

- Frontend: `http://seeksophie.meetutor.com`
- Backend API: `http://api.seeksophie.meetutor.com`
- Repo: `https://github.com/namlengoc/seeksophie`

## Prerequisites (server)

- Ubuntu/Debian VPS with Docker + Docker Compose plugin
- Nginx
- DNS A records:
  - `seeksophie.meetutor.com` → server IP (`178.104.1.73`)
  - `api.seeksophie.meetutor.com` → server IP
- Ports `3100` and `8800` free on localhost (not exposed publicly; Nginx proxies traffic)

## 1. SSH into the server

```bash
ssh root@178.104.1.73
```

## 2. Clone the repository

```bash
cd /var/www
git clone https://github.com/namlengoc/seeksophie.git
cd seeksophie
```

If the repo is private, use a deploy key or personal access token.

## 3. Create environment files

```bash
cp .env.production.example .env
cp backend/.env.production.example backend/.env
```

Edit both files:

```bash
nano .env
nano backend/.env
```

**Required changes:**

| Variable | Value |
|----------|--------|
| `NEXT_PUBLIC_API_URL` | `http://api.seeksophie.meetutor.com` |
| `POSTGRES_PASSWORD` | strong password (same in root `.env` and `backend/.env`) |
| `DB_PASSWORD` | same as `POSTGRES_PASSWORD` |
| `GEMINI_API_KEY` or `OPENAI_API_KEY` | your LLM key |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Google OAuth (if using Google login) |
| `APP_KEY` | generate after first boot (see step 5) |

**Google Cloud Console** (OAuth):

- Authorized JavaScript origins: `http://seeksophie.meetutor.com`
- Authorized redirect URI: `http://api.seeksophie.meetutor.com/api/v1/auth/social/google/callback`

## 4. Build and start containers

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

Check status:

```bash
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs -f backend queue-worker
```

## 5. Generate Laravel APP_KEY (first deploy only)

```bash
docker compose -f docker-compose.prod.yml exec backend php artisan key:generate --force
docker compose -f docker-compose.prod.yml exec backend php artisan config:cache
```

Verify health:

```bash
curl -s http://127.0.0.1:8800/up
curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:3100/
```

## 6. Configure Nginx

```bash
cp deploy/nginx/seeksophie.conf.example /etc/nginx/sites-available/seeksophie
ln -sf /etc/nginx/sites-available/seeksophie /etc/nginx/sites-enabled/seeksophie
nginx -t
systemctl reload nginx
```

Test from your machine:

```bash
curl -I http://seeksophie.meetutor.com/
curl -I http://api.seeksophie.meetutor.com/up
```

## 7. HTTPS (recommended)

```bash
apt install -y certbot python3-certbot-nginx
certbot --nginx -d seeksophie.meetutor.com -d api.seeksophie.meetutor.com
```

After HTTPS, update:

- Root `.env`: `NEXT_PUBLIC_API_URL=https://api.seeksophie.meetutor.com`
- `backend/.env`: `APP_URL`, `FRONTEND_APP_URL`, `CORS_ALLOWED_ORIGINS`, `GOOGLE_REDIRECT_URI` → `https://...`
- Google OAuth console → switch to `https://`
- Rebuild frontend (API URL is baked in at build time):

```bash
docker compose -f docker-compose.prod.yml up -d --build frontend
docker compose -f docker-compose.prod.yml exec backend php artisan config:cache
```

## 8. Deploy updates

```bash
cd /var/www/seeksophie
git pull
docker compose -f docker-compose.prod.yml up -d --build
docker compose -f docker-compose.prod.yml restart queue-worker
```

## 9. Troubleshooting

| Issue | Check |
|-------|--------|
| Frontend shows wrong API | Rebuild frontend after changing `NEXT_PUBLIC_API_URL` |
| CORS errors | `CORS_ALLOWED_ORIGINS` must include frontend URL |
| Google OAuth redirect wrong | `FRONTEND_APP_URL`, `GOOGLE_REDIRECT_URI`, Google Console |
| Articles stuck processing | `docker compose -f docker-compose.prod.yml logs queue-worker` |
| AI errors | `docker compose -f docker-compose.prod.yml logs ai-service` |
| Upload fails | Nginx `client_max_body_size 50m` |

## Port map (localhost only)

| Service | Host port |
|---------|-----------|
| Frontend | 3100 |
| Backend | 8800 |
| PostgreSQL | internal only |
| Redis | internal only |
| AI service | internal only |
