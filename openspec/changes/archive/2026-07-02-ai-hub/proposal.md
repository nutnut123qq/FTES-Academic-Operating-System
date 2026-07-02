## Why

§9 AI Platform had no landing surface — the app has scattered AI helpers (content
tutor, subject AI tab) but no single hub where a learner (or teacher) sees every AI
tool at a glance, grouped by who it serves. `/ai` was 404. This ships the hub shell
(FE-only, mock) so `/ai` becomes a real 200 route and the domain has a home.

## What Changes

- Add `features/ai-platform/AiHub` + `[locale]/ai/page.tsx`: title + subtitle + a card
  grid of AI tools grouped by category. Mirrors the house catalog archetype
  (`SubjectCatalog`): accent icon badge + name + short desc + an "Open" CTA per card.
- Add `useQueryAiToolsSwr` (mock list of ~8 tools `{ id, key, category }`, SWR-shaped).
- Add `aiPlatform.*` i18n (vi/en): title/subtitle/open, `categories.*`, and
  `tools.<key>.{name,desc}` for each tool slug.

## Capabilities

### New Capabilities
- `ai-hub`: the AI tools hub at `/ai`.

### Modified Capabilities
- (none)

## Impact
- FE: new `features/ai-platform/AiHub`, `ai/page.tsx`, `useQueryAiToolsSwr`; i18n
  `aiPlatform.*`. No BE (mock). No shared-file edits (nav/path wiring deferred).
