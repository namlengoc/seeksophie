# Phase 3: Social Integration & Advanced Auth

**Status:** 📋 Planned  
**Dependencies:** Phase 1 ✅

---

## Goals

Replace mock auth with social login, complete the editorial workflow, and distribute content.

---

## Checklist (not yet implemented)

### Authentication
- [ ] Laravel Socialite — Google, Slack, Apple ID
- [ ] Map `provider` + `provider_id` on `users` table
- [ ] Link social account to existing user (optional)

### Editorial workflow
- [ ] `under_review` status — Author submits article
- [ ] Editor/Admin: Approve → `published` / Reject → `draft` + feedback
- [ ] Assign `reviewer_id` when Editor picks up review
- [ ] Email/in-app notifications (optional)

### Social & distribution
- [ ] Share buttons for Facebook, LinkedIn, Pinterest
- [ ] Sync API to Headless CMS (WordPress / Webflow)
- [ ] Auto cover image via DALL-E 3 from article title

### Frontend
- [ ] Submit to Review screen (Author)
- [ ] Review queue screen (Editor/Admin)
- [ ] Reject modal with reason

---

[← Phase 2](./phase-2-document-intelligence.md) · [Master plan](../project-master-plan.md) · [Phase 4 →](./phase-4-enterprise-dashboard.md)
