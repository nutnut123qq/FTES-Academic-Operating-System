# Workplace: Subject Images

## Why

Every subject in the workplace (catalog `/subjects` + workspace shell) renders only a
code-initials badge — the grid reads as a wall of identical accent squares, with no visual
identity per subject. Giving each subject an image makes the catalog scannable and the
workspace header recognizable, matching the course catalog's image-first card archetype.

## What Changes

- Extend the `Subject` type (`useQuerySubjectSwr`) with `imageUrl: string | null` and
  optional `accentColor`; populate the mock catalog (`useQuerySubjectsSwr`) and the
  single-subject mock with deterministic local image paths per subject code.
- Add local placeholder artwork under `public/subjects/<code>.png` (one per mock subject:
  `prf192`, `csd201`, `prj301`, `dbi202`, `swp391`, `net1704`) — reusing existing repo PNG
  artwork as the source; no remote hosts, no `next.config` `remotePatterns` change.
- Catalog card: add a top cover thumbnail (`next/image`, fixed aspect ratio, cover crop)
  above the existing identity row; skeleton while the list loads.
- Workspace shell header: replace the initials badge with the subject image when present.
- Fallback everywhere: when `imageUrl` is null **or the image fails to load**, keep the
  current code-initials badge (no broken-image glyph, no layout shift).
- Alt text = subject name (a11y); existing `subjects.*` i18n keys untouched but verified.

## Capabilities

### New Capabilities
- `subject-visual-identity`: per-subject imagery in the workplace — Subject type image
  fields, catalog card thumbnail, workspace header identity image, initials fallback,
  loading skeleton, broken-image handling, responsive sizing, a11y alt text.

### Modified Capabilities

<!-- none — the catalog card and shell header have no existing spec; subject-workspace-overview requirements are unchanged -->

## Impact

- `src/components/features/subject/hooks/useQuerySubjectSwr.ts` — `Subject` type + mock.
- `src/components/features/subject/hooks/useQuerySubjectsSwr.ts` — mock list data.
- `src/components/features/subject/SubjectCatalog/index.tsx` — card layout + thumbnail + skeleton.
- `src/components/features/subject/SubjectWorkspaceShell/index.tsx` — header identity image.
- `public/subjects/*.png` — new static placeholder assets (local copies of existing artwork).
- No API/BE change (mock-only), no new dependency, no `next.config.ts` change.
