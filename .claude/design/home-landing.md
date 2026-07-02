# Design — home landing (`/[locale]`)

Page-level UX decisions for the academic-OS landing. Grows each `/starci-fe-ux-apply`.

## 2026-07-02 — Landing = product tour + bento (direction A), academic-OS story
- **Archetype:** marketing/on-ramp landing, full-bleed sections with inner `max-w-6xl`.
  Composed IN the feature (a landing is a one-off composition — no new blocks; feature
  owns copy + nav, tokens/HeroUI own the look).
- **Section order:** Hero (eyebrow chip · h1 headline w/ `t.rich` accent · subline · 2
  CTAs) → Bento grid of the built domains → 3 value pillars (AI · gamification · career)
  → final CTA. Footer comes from `InnerLayout` (landing route); sidebar gated off.
- **Bento:** `sm:grid-cols-2 lg:grid-cols-3 lg:auto-rows-fr`; Subject workspace tile big
  (`sm:col-span-2 lg:row-span-2`) since §3 is the ⭐ core domain. Tiles = house card class
  `rounded-large border border-separator p-6`, linked ones add `hover:bg-default/40`.
- **Positioning decision (the fork that shaped everything):** the repo shipped a full
  legacy `landing.*` i18n = the **StarCi coding-interview-school** pitch (Fullstack/System
  Design/DevOps tracks, founder truths, recruiter). User chose **Academic OS** (ftes.txt)
  → wrote a NEW `homeLanding.*` key instead of reusing the off-message legacy copy. Legacy
  `landing.*`/`home.*` left unused for a later cleanup.
- **Demo-subject link:** Subject tile + CTA point at `/subjects/PRF192` (mock renders for
  any id) because the `/subjects` list is 404 until Phase 1. `ponytail:` comment marks the
  upgrade path. Never link a landing card at a 404.
- **Files:** `features/home-landing/HomeLanding/index.tsx`, `app/[locale]/page.tsx`,
  `messages/{en,vi}.json` (`homeLanding.*`). OpenSpec `home-landing`. tsc/eslint/build green.
