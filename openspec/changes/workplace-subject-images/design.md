# Design — Workplace Subject Images

## Context

- Catalog `/subjects` (`SubjectCatalog`) renders hand-rolled link-cards: identity row
  (initials badge + code/name), then a chip row. No image, no skeleton (the mock resolves
  instantly today, but the hook is SWR-shaped for a real BE swap).
- Workspace shell (`SubjectWorkspaceShell`) header uses the same `size-11` initials badge.
- `Subject` (in `useQuerySubjectSwr.ts`) has no visual fields. Both hooks are mock-only
  (`ponytail` markers) and must keep their API so the BE swap is drop-in.
- House canon: feature owns data + behavior, tokens/blocks own the look; hover on a
  go-there card = existing `hover:bg-default/40` treatment (keep, don't invent a zoom).

## Goals / Non-Goals

**Goals**
- Deterministic per-subject imagery with zero network dependency (local `/public` assets).
- Graceful degradation: null or broken image → the exact current initials badge.
- No layout shift: the thumbnail region reserves its box via aspect ratio.

**Non-Goals**
- No BE contract, no upload/admin flow, no image CDN or `remotePatterns`.
- No redesign of card content below the thumbnail, no hover-zoom effects.
- `accentColor` is carried in the type + mock only; no themed rendering yet (future use
  for badge/skeleton tinting).

## Decisions

1. **Image source = local static assets `public/subjects/<code-lowercase>.png`**
   (e.g. `/subjects/prf192.png`, `/subjects/dbi202.png`). Seed them by copying existing
   repo artwork (`public/1.png`, `2.png`, `3.png`, `devops-cloud-mastery.png`,
   `fullstack-mastery.png`, `system-design-mastery.png` → six subjects, six files).
   - *Alternative — picsum/remote placeholders*: rejected; needs `remotePatterns`,
     non-deterministic in CI/offline dev, and dies with the mock swap anyway.
   - One mock subject (`net1704`) ships `imageUrl: null` intentionally so the fallback
     path is exercised in the real UI, not just in specs.
2. **`imageUrl: string | null` (required, nullable) + `accentColor?: string`** on
   `Subject`. Nullable-required forces every mock row (and the future BE mapper) to make
   an explicit decision; optional `accentColor` stays additive.
3. **Rendering via `next/image` with `fill` + `object-cover`** inside a relatively
   positioned box; `sizes` matched to the grid (`(min-width:1024px) 33vw,
   (min-width:640px) 50vw, 100vw`). Local assets ⇒ no config change.
4. **Card layout**: thumbnail becomes a full-bleed top region of the card —
   `aspect-video` (16:9), rounded top corners (card gets `overflow-hidden`), existing
   identity row + chip row unchanged below. With `imageUrl: null` the card keeps today's
   image-less layout (initials badge in the identity row does the identity work) — no
   empty gray box.
5. **Shell header**: the `size-11` badge slot renders the image (`rounded-large`,
   `object-cover`, same footprint) when available; otherwise the initials badge. Same
   box size ⇒ zero header layout change.
6. **Broken image → initials**: track `onError` per image (local component state) and
   swap to the initials badge. No broken-image icon may ever render.
7. **Skeleton**: catalog gates on `isLoading || error` (per house skeleton rule) with
   skeleton cards mirroring the real card (thumbnail box + two text lines + chip row),
   HeroUI `Skeleton`. Header keeps its current progressive-render behavior (it already
   renders route-derived code while loading); no new header skeleton.

## Risks / Trade-offs

- [Copied artwork is course-branded, not subject-specific] → acceptable for mock stage;
  file names are keyed by subject code so swapping in real art is a file replacement.
- [`fill` requires a sized parent] → the `aspect-video` wrapper guarantees it; spec
  scenario covers no-layout-shift.
- [Future BE may send remote URLs] → then add `remotePatterns`; noted as a follow-up in
  the mock comment, out of scope now.

## Open Questions

- None blocking. `accentColor` consumption (tinted fallback badge/skeleton) deferred.
