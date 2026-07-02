## 1. Hub
- [x] 1.1 `useQueryAiToolsSwr` — mock list ~8 tools `{ id, key, category }` (SWR-shaped)
- [x] 1.2 `features/ai-platform/AiHub` — title + subtitle + card grid grouped by category
- [x] 1.3 `[locale]/ai/page.tsx` renders AiHub

## 2. Wiring
- [x] 2.1 i18n `aiPlatform.*` (title/subtitle/open, categories.*, tools.<key>.{name,desc}) (vi/en)

## 3. Verify
- [x] 3.1 eslint clean + JSON valid (build/tsc deferred — FE-only mock shell)
