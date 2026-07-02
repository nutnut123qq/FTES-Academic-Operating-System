## Why

§21 Career Center is the domain that turns learning into employability — a skill
graph (what the student has built), career roadmaps (where those skills lead), and
jobs (concrete openings). There was no `/career` route yet. This ships a FE-only
mock shell so the domain is reachable and its shape is fixed before BE lands.

## What Changes

- Add `features/career/CareerCenter` + `[locale]/career/page.tsx`: one page with
  three sections — skill graph (skill rows + progress meter), career roadmaps (card
  grid of 6 tracks), and jobs (list of openings with a type chip + apply CTA).
- Add `useQueryCareerSwr` (mock `skills`/`roadmaps`/`jobs`, SWR-shaped, `ponytail:`
  BE-swap note).
- Add `careerCenter.*` i18n (vi/en) — title/subtitle/section labels, roadmap keys,
  job types, and the view-roadmap / apply / progress-label strings.

## Capabilities

### New Capabilities
- `career-center`: the Career Center at `/career`.

### Modified Capabilities
- (none)

## Impact
- FE: new `features/career/CareerCenter`, `career/page.tsx`, `useQueryCareerSwr`;
  new `careerCenter.*` i18n (vi/en). No BE (mock). No shared-file edits (nav/paths
  wiring deferred). Buttons are mock (no handlers).
