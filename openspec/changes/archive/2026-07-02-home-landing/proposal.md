## Why

`/[locale]` was a skeleton placeholder ("Skeleton sẵn sàng"). The legacy `landing.*`
i18n is the old StarCi coding-interview-school pitch (Fullstack/System Design/DevOps
tracks, founder), which conflicts with the FTES AOS academic-OS vision (ftes.txt).
User chose positioning = **Academic OS** and landing direction **A** (product tour +
bento). Ship a landing that tells the academic-OS story AND doubles as an on-ramp
into the built domains.

## What Changes

- Add `features/home-landing/HomeLanding` rendered by `[locale]/page.tsx`:
  - Hero: eyebrow · headline (accent) · subline · CTAs (Explore courses · Join community)
  - Bento grid of the ecosystem — Subject workspace (big, links to a demo subject) ·
    Courses · Resources · Community · Groups · XP; cards link into the app.
  - 3 value pillars: AI tutor · gamification · career bridge.
  - Final CTA (Explore courses · See a subject workspace).
- New i18n `homeLanding.*` (vi/en) — academic-OS copy, separate from legacy `landing.*`.
- Footer already renders on landing via `InnerLayout`; no sidebar (gated off).

## Capabilities

### New Capabilities
- `home-landing`: the academic-OS marketing/on-ramp landing.

### Modified Capabilities
- (none)

## Impact
- FE: new `features/home-landing/*`, `[locale]/page.tsx`, i18n. No BE. Build stays green.
- Legacy `landing.*` / `home.*` i18n now fully unused (left for a separate cleanup).
