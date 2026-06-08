# Production Deployment Guide

Deploy Seek Sophie to the Meetutor VPS (`178.104.1.73`).

| Item | Value |
|------|--------|
| Install path | `/opt/seeksophie` |
| Frontend | `https://seeksophie.meetutor.com` |
| Backend API | `https://seeksophie-api.meetutor.com` |
| Repo | `https://github.com/namlengoc/seeksophie` |
| Reverse proxy | **Caddy** (port 80/443) — flashcard runs at `/opt/meetutor` |

## Prerequisites

- Docker + Docker Compose (already on server)
- Caddy on port 80/443 (already running for meetutor.com)
- DNS A records → `178.104.1.73`:
  - `seeksophie.meetutor.com`
  - `seeksophie-api.meetutor.com`
- Ports `3100` and `8800` free on localhost

---

## Step 1 — SSH

```bash
ssh root@178.104.1.73
```

## Step 2 — Clone into `/opt/seeksophie`

```bash
cd /opt
git clone https://github.com/namlengoc/seeksophie.git
cd seeksophie
git branch   # expect * main
```

Private repo:

```bash
git clone https://<TOKEN>@github.com/namlengoc/seeksophie.git /opt/seeksophie
```

## Step 3 — Environment files

```bash
cd /opt/seeksophie
cp .env.production.example .env
cp backend/.env.production.example backend/.env
nano .env
nano backend/.env
```

### `/opt/seeksophie/.env`

```env
FRONTEND_PORT=3100
BACKEND_PORT=8800
NEXT_PUBLIC_API_URL=https://seeksophie-api.meetutor.com

POSTGRES_DB=seeksophie_ai
POSTGRES_USER=seeksophie
POSTGRES_PASSWORD=<strong-password>

GEMINI_API_KEY=<your-key>
LLM_PROVIDER=auto
```

### `/opt/seeksophie/backend/.env`

| Variable | Value |
|----------|--------|
| `DB_PASSWORD` | same as `POSTGRES_PASSWORD` |
| `DB_USERNAME` | `seeksophie` |
| `APP_URL` | `https://seeksophie-api.meetutor.com` |
| `FRONTEND_APP_URL` | `https://seeksophie.meetutor.com` |
| `CORS_ALLOWED_ORIGINS` | `https://seeksophie.meetutor.com` |
| `GOOGLE_CLIENT_ID` / `SECRET` | from Google Console |
| `GOOGLE_REDIRECT_URI` | `https://seeksophie-api.meetutor.com/api/v1/auth/social/google/callback` |

**Google OAuth:**

- Origins: `https://seeksophie.meetutor.com`
- Redirect: `https://seeksophie-api.meetutor.com/api/v1/auth/social/google/callback`

## Step 4 — Build & start Docker

```bash
cd /opt/seeksophie
docker compose -f docker-compose.prod.yml up -d --build
```

Wait 3–5 minutes, then:

```bash
docker compose -f docker-compose.prod.yml ps
```

All services should be **Up**: `frontend`, `backend`, `queue-worker`, `ai-service`, `postgres`, `redis`.

## Step 5 — Laravel APP_KEY (first deploy)

```bash
cd /opt/seeksophie
docker compose -f docker-compose.prod.yml exec backend php artisan key:generate --force
docker compose -f docker-compose.prod.yml exec backend php artisan config:cache
```

Internal health check:

```bash
curl http://127.0.0.1:8800/up
curl -I http://127.0.0.1:3100/
```

## Step 6 — Caddy reverse proxy

View existing config (meetutor flashcard):

```bash
cat /etc/caddy/Caddyfile
```

Append at the end:

```caddy
seeksophie.meetutor.com {
	reverse_proxy 127.0.0.1:3100
}

seeksophie-api.meetutor.com {
	reverse_proxy 127.0.0.1:8800
}
```

Or copy from repo:

```bash
cat /opt/seeksophie/deploy/caddy/seeksophie.snippet.example >> /etc/caddy/Caddyfile
```

Validate & reload:

```bash
caddy validate --config /etc/caddy/Caddyfile
systemctl reload caddy
```

Caddy auto-provisions HTTPS via Let's Encrypt.

## Step 7 — Test public URLs

```bash
curl -I https://seeksophie.meetutor.com/
curl https://seeksophie-api.meetutor.com/up
```

Browser:

1. Open `https://seeksophie.meetutor.com/`
2. Upload `.docx` + images
3. Login: `author@seeksophie.com` / `password`

## Step 8 — Deploy updates

```bash
cd /opt/seeksophie
git pull origin main
docker compose -f docker-compose.prod.yml up -d --build
docker compose -f docker-compose.prod.yml restart queue-worker
```

If `NEXT_PUBLIC_API_URL` changed, rebuild frontend:

```bash
docker compose -f docker-compose.prod.yml up -d --build frontend
```

## Architecture on this server

```
Caddy :80/:443
├── meetutor.com              → 127.0.0.1:3000   (/opt/meetutor — flashcard)
├── api.meetutor.com          → 127.0.0.1:8000
├── seeksophie.meetutor.com   → 127.0.0.1:3100   (/opt/seeksophie)
└── seeksophie-api.meetutor.com → 127.0.0.1:8800
```

## Troubleshooting

| Issue | Fix |
|-------|-----|
| 502 from Caddy | `docker compose -f docker-compose.prod.yml ps` — containers up? |
| Wrong API URL in browser | Rebuild frontend after `.env` change |
| CORS | `CORS_ALLOWED_ORIGINS` in `backend/.env` |
| Stuck processing | `docker compose -f docker-compose.prod.yml logs queue-worker -f` |
| AI errors | `docker compose -f docker-compose.prod.yml logs ai-service` |
