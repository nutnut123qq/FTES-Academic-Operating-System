## 1. Timeline
- [x] 1.1 `useQueryActivitySwr` — mock timeline list (~8 `{ id, kind, text, time }`)
- [x] 1.2 `features/activity/ActivityTimeline` — vertical feed (icon badge + text + relative time + empty state)
- [x] 1.3 `[locale]/activity/page.tsx` renders ActivityTimeline

## 2. Wiring
- [x] 2.1 i18n `activity.{title,subtitle,empty}` + `activity.kinds.*` (vi/en)

## 3. Verify
- [ ] 3.1 eslint clean + JSON valid (build/tsc skipped per task scope)

## Notes
- FE surface only; the real Activity Engine backbone is BE (§18). DO NOT archive.
