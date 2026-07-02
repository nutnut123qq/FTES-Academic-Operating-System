## Why

`/subjects` was 404 — Subject Workspace (§3, the ⭐ core domain) had per-subject
workspaces (`/subjects/[subjectId]`) but no catalog/list to reach them, so the app
shell and the home landing had to link at a hardcoded demo subject. This ships the
list (Phase 1 start), turning `/subjects` into a real 200 route.

## What Changes

- Add `features/subject/SubjectCatalog` + `[locale]/subjects/page.tsx`: text search +
  difficulty filter + grid of subject cards linking to each workspace. Mirrors the
  house catalog archetype (`CourseCatalog`).
- Add `useQuerySubjectsSwr` (mock list, reuses the `Subject` shape).
- Add `nav.subjects` + `subjects.catalog.*` i18n (vi/en).
- Surface Subjects in the app sidebar/mobile nav (`useAppNav`, top of "Học") +
  `subjects` path builder → `/subjects` now reachable from the chrome.
- Point the home-landing Subject tile at `/subjects` (list) instead of the demo id;
  the "See a subject workspace" CTA still opens the demo workspace.

## Capabilities

### New Capabilities
- `subjects-list`: the subject catalog at `/subjects`.

### Modified Capabilities
- (none)

## Impact
- FE: new `features/subject/SubjectCatalog`, `subjects/page.tsx`, `useQuerySubjectsSwr`;
  edits to `useAppNav`, `resources/path`, `HomeLanding`, i18n. No BE (mock). Build green.
