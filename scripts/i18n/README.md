# UI translations — Seek Sophie

Flat JSON key files (same pattern as flashcard `scripts/i18n/translations`).

## Source of truth

| Location | Purpose |
|----------|---------|
| `scripts/i18n/translations/` | Canonical copies for docs / tooling |
| `frontend/lib/i18n/translations/` | **Used by Next.js** (must stay in sync) |

When editing strings, update **both** folders or run:

```bash
cp scripts/i18n/translations/*.json frontend/lib/i18n/translations/
```

## Supported locales (10)

`en`, `vi`, `ja`, `ko`, `zh-cn`, `th`, `id`, `es`, `fr`, `de`

Frontend loads via `frontend/lib/i18n/index.js`.

**Content language** (document detect + AI output) uses the same 10 codes.
