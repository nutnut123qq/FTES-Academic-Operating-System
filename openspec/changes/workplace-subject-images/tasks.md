# Tasks — Workplace Subject Images

## 1. Assets + data

- [x] 1.1 Create `public/subjects/` and copy existing repo artwork to per-code files:
      `prf192.png`, `csd201.png`, `prj301.png`, `dbi202.png`, `swp391.png`, `net1704.png`
      (sources: `public/1.png`, `2.png`, `3.png`, `devops-cloud-mastery.png`,
      `fullstack-mastery.png`, `system-design-mastery.png`)
- [x] 1.2 Extend `Subject` in `src/components/features/subject/hooks/useQuerySubjectSwr.ts`
      with `imageUrl: string | null` and `accentColor?: string` (TSDoc on both); set the
      single-subject mock's `imageUrl` deterministically from the id
      (`/subjects/<id-lowercase>.png`)
- [x] 1.3 Populate `useQuerySubjectsSwr.ts` mock rows with `imageUrl` per code; set
      `net1704` to `imageUrl: null` (intentional fallback exercise); note the future
      `remotePatterns` follow-up in the existing ponytail comment

## 2. Catalog card

- [x] 2.1 In `SubjectCatalog/index.tsx`, add the 16:9 `next/image` cover thumbnail
      (relative `aspect-video` wrapper, `fill`, `object-cover`, `sizes` matching the
      1/2/3-column grid, `alt` = subject name, card `overflow-hidden`); keep identity +
      chip rows and the `hover:bg-default/40` treatment unchanged
- [x] 2.2 Handle `imageUrl: null` and image `onError` → render today's image-less card
      (no empty box, no broken glyph)
- [x] 2.3 Add the loading skeleton: gate the grid on `isLoading || error` and render
      skeleton cards mirroring the real card (thumbnail box + two text lines + chip line,
      HeroUI `Skeleton`); title/search/filters stay static

## 3. Workspace header

- [x] 3.1 In `SubjectWorkspaceShell/index.tsx`, render the subject image in the `size-11`
      identity slot (`rounded-large`, cover) when `imageUrl` is non-null; fall back to the
      initials badge on null, loading, or `onError` — identical slot footprint

## 4. Verify

- [x] 4.1 Confirm `subjects.*` i18n keys are untouched and `vi`/`en` messages stay
      key-parallel (no new strings expected) — verified: 102 `subjects.*` keys, parallel
- [ ] 4.2 `npm run build` (webpack) green — build: batch-verified by orchestrator
- [x] 4.3 `npx tsc --noEmit` clean
