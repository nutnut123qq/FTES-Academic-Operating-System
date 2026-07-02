## Why

The Activity Engine (§18) is a BE backbone that records what a user does across the
platform (enrolments, lesson completions, uploads, questions, badges, coins, events,
groups). Nothing on the FE surfaces that stream yet. This ships the FE surface — a
read-only activity timeline at `/activity` — so the shell has a place to render the
engine's output once the BE contract lands.

## What Changes

- Add `features/activity/ActivityTimeline` + `[locale]/activity/page.tsx`: a vertical
  feed where each row is an accent-tinted kind icon + event text + relative time,
  separated rows, with an empty state.
- Add `useQueryActivitySwr` (mock timeline list, SWR-shaped, `ponytail:` swap note).
- Add `activity.*` i18n (vi/en): title/subtitle/empty + the eight kind labels.

## Capabilities

### New Capabilities
- `activity-timeline`: the user activity feed at `/activity` (FE surface only).

### Modified Capabilities
- (none)

## Impact
- FE: new `features/activity/ActivityTimeline`, `activity/page.tsx`,
  `useQueryActivitySwr`, i18n. No BE — the real Activity Engine backbone is BE and
  out of scope here; this is a mock FE shell (drop-in swap point marked).
