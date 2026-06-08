# PROJECT SPECIFICATION: AI-POWERED TRAVEL CMS PLATFORM (V2.0)

> **Master plan** — high-level overview + main content per phase. Detailed checklists live in [docs/phases/](./phases/README.md).

## 1. Project Overview & Core Goals

An AI-integrated CMS that helps Seek Sophie turn raw data (.docx, images, etc.) into magazine-style travel articles, with Author / Editor / Admin roles.

**Overall progress:** 1 / 4 phases complete

---

## 2. Phase Roadmap — Overview

| Phase | Name | Status | Depends on | Detailed doc |
|-------|------|--------|------------|--------------|
| **1** | Core AI Loop | ✅ **Complete** | — | [phase-1-core-ai-loop.md](./phases/phase-1-core-ai-loop.md) |
| **2** | Document Intelligence | 📋 Planned | Phase 1 | [phase-2-document-intelligence.md](./phases/phase-2-document-intelligence.md) |
| **3** | Social & Advanced Auth | 📋 Planned | Phase 1 | [phase-3-social-auth.md](./phases/phase-3-social-auth.md) |
| **4** | Enterprise Dashboard | 📋 Planned | Phase 3 | [phase-4-enterprise-dashboard.md](./phases/phase-4-enterprise-dashboard.md) |

---

## 3. Phase details

### Phase 1: Core AI Loop — ✅ Complete

**Goal:** Upload → detect language → AI processing → editor with source mapping; multilingual site + landing page.

**Delivered:**

| Area | Main content | Status |
|------|--------------|--------|
| **Infrastructure** | Docker Compose (Next.js, Laravel, Queue Worker, FastAPI, PostgreSQL, Redis), auto migrate + seed | ✅ |
| **Backend** | Sanctum auth, articles CRUD/upload, detect-language, `source_lang`, queue job, IDOR | ✅ |
| **AI Service** | process-document (+ output language), detect-language, detect-document-language, langdetect | ✅ |
| **Frontend** | Landing `/`, i18n 10 locales, upload detect/confirm, editor, source highlight, carousel | ✅ |

**Core flow:** Detect `.docx` language → confirm (if ≠ EN) → upload + `source_lang` → queue → AI extract in same language → editor.

**Supported languages:** `en`, `vi`, `ja`, `ko`, `zh-cn`, `th`, `id`, `es`, `fr`, `de` — files in `scripts/i18n/translations/`.

**Current limits (deferred to later phases):** mock auth, `.docx` only, no editorial approval workflow.

→ Full checklist, API endpoints, mermaid diagram: [phase-1-core-ai-loop.md](./phases/phase-1-core-ai-loop.md)

---

### Phase 2: Multi-format Ingestion & Document Intelligence — 📋 Planned

**Goal:** Expand inputs and improve document/image analysis.

**Main scope:**

| Area | Planned content | Status |
|------|-----------------|--------|
| **Ingestion** | Strategy Pattern: PDF (`pdfplumber`), Raw Text, OCR (Google Cloud Vision) | ⬜ |
| **Raw Chunks** | Extended metadata: `source_type`, `page_number`, `bbox` | ⬜ |
| **Multimodal** | Auto image captions, deeper image analysis, smarter placement hints | ⬜ |
| **Frontend** | PDF upload preview, chunk metadata in Original Notes tab | ⬜ |

> Multi-image upload, carousel, and inline placement exist in Phase 1 — Phase 2 does not repeat that basic UI.

→ [phase-2-document-intelligence.md](./phases/phase-2-document-intelligence.md)

---

### Phase 3: Social Integration & Advanced Auth — 📋 Planned

**Goal:** Replace mock auth, complete editorial workflow, distribute content.

**Main scope:**

| Area | Planned content | Status |
|------|-----------------|--------|
| **Auth** | Laravel Socialite (Google, Slack, Apple ID), map `provider` / `provider_id` | ⬜ |
| **Workflow** | Submit → Under Review → Approve/Reject, assign `reviewer_id`, feedback | ⬜ |
| **Distribution** | Social share, Headless CMS sync, DALL-E cover image | ⬜ |
| **Frontend** | Submit screen (Author), Review queue (Editor/Admin), reject modal | ⬜ |

→ [phase-3-social-auth.md](./phases/phase-3-social-auth.md)

---

### Phase 4: Enterprise Dashboard & Workspace — 📋 Planned

**Goal:** Admin dashboard: Kanban, analytics, user management.

**Main scope:**

| Area | Planned content | Status |
|------|-----------------|--------|
| **Kanban** | Draft → Under Review → Published (+ Failed) board, drag & drop, filters | ⬜ |
| **Analytics** | AI Accuracy Rate, processing time, Author/Editor stats | ⬜ |
| **Admin** | CRUD users + assign roles, audit log (optional) | ⬜ |
| **Infra** | Horizon/queue monitoring, staging + production profiles | ⬜ |

→ [phase-4-enterprise-dashboard.md](./phases/phase-4-enterprise-dashboard.md)

---

## 4. User Roles & Permission Matrix

| Role | Demo email | Permissions (current — Phase 1) |
|------|------------|----------------------------------|
| **Admin** | admin@seeksophie.com | View & edit all articles |
| **Editor** | editor@seeksophie.com | View & edit all articles |
| **Author** | author@seeksophie.com | Upload, view & edit own articles |

Mock password: `password` · Auth: Laravel Sanctum (Bearer token).

**IDOR:** Author accessing another user's article → HTTP 404.

---

## 5. Database Schema (PostgreSQL)

### `users`
`id`, `name`, `email`, `password`, `role` (`admin`|`editor`|`author`), `provider`, `provider_id`

### `articles`
`id`, `user_id`, `reviewer_id`, `title`, `status`, `raw_content_json`, `extracted_data_json`, `document_path`, `image_paths`, `error_message`, timestamps

Index: `user_id`, `status`

---

## 6. Monorepo Architecture

```
seeksophie/
├── frontend/          Next.js 14
├── backend/           Laravel 11 + Queue Worker
├── ai-service/        FastAPI
├── docs/
│   ├── project-master-plan.md   ← this file
│   ├── ai-service-spec.md
│   └── phases/                  ← per-phase checklists
└── docker-compose.yml
```

| Service | Port (host) |
|---------|-------------|
| Frontend | 3100 |
| Laravel API | 8800 |
| AI Service | 8802 |
| PostgreSQL | 5433 |
| Redis | 6380 |

---

## 7. Related documentation

| Document | Description |
|----------|-------------|
| [phases/README.md](./phases/README.md) | Index + phase update conventions |
| [ai-service-spec.md](./ai-service-spec.md) | Pydantic schema, prompt, boundary check |
| [README.md](../README.md) | Quick start, curl, ports |

---

*Update the master plan when scope/schema changes; tick detailed checklists in `docs/phases/`.*
