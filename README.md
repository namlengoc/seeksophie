# Seek Sophie Monorepo

AI-powered travel CMS platform — Docker Compose monorepo with Next.js frontend, Laravel API, FastAPI AI service, PostgreSQL, and Redis.

## Quick Start

```bash
docker compose up --build
```

| Service       | URL (from host machine)    |
|---------------|----------------------------|
| Frontend      | http://localhost:3100      |
| Laravel API   | http://localhost:8800      |
| AI Service    | http://localhost:8802      |
| PostgreSQL    | localhost:5433             |
| Redis         | localhost:6380             |

> Ports can be customized via the root `.env` file (`BACKEND_PORT`, `FRONTEND_PORT`, ...).

## User Flow

1. **Login** — `/login` (3 mock accounts, password: `password`)
2. **Upload** — `/` drag & drop `.docx` + images (jpg/png/webp)
3. **Processing** — `/processing/{id}` polls every 3 seconds
4. **Dashboard** — `/dashboard` article list by role
5. **Editor** — `/editor/{id}` tabs: Original Notes · Magazine Article · Edit

## Mock Auth Accounts

| Role   | Email                  | Password |
|--------|------------------------|----------|
| Admin  | admin@seeksophie.com   | password |
| Editor | editor@seeksophie.com  | password |
| Author | author@seeksophie.com  | password |

## API Endpoints

```bash
# Login
curl -X POST http://localhost:8800/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"author@seeksophie.com","password":"password"}'

# Detect document language (.docx)
curl -X POST http://localhost:8800/api/v1/articles/detect-language \
  -H "Authorization: Bearer {token}" \
  -F "document=@notes.docx"

# Upload .docx + images (+ source_lang: en|vi|ja|ko|zh-cn|th|id|es|fr|de)
curl -X POST http://localhost:8800/api/v1/articles/upload \
  -H "Authorization: Bearer {token}" \
  -F "document=@notes.docx" \
  -F "source_lang=vi" \
  -F "images[0]=@photo1.jpg"

# Poll status
curl http://localhost:8800/api/v1/articles/{id}/status \
  -H "Authorization: Bearer {token}"

# Get article (includes images[] URLs)
curl http://localhost:8800/api/v1/articles/{id} \
  -H "Authorization: Bearer {token}"

# Update article
curl -X PUT http://localhost:8800/api/v1/articles/{id} \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"title":"New Title","extracted_data_json":{...}}'
```

## Project Structure

```
├── backend/       Laravel 11 API + Queue Worker
├── frontend/      Next.js 14
├── ai-service/    FastAPI AI Engine
├── docs/          Master plan + phase plans (docs/phases/)
└── docker-compose.yml
```

Phase details: [docs/phases/README.md](docs/phases/README.md) · Master plan: [docs/project-master-plan.md](docs/project-master-plan.md)

## Production deploy

See [docs/DEPLOY.md](docs/DEPLOY.md) for VPS deployment (Nginx + Docker Compose).
