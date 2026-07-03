# Design — home landing (`/[locale]`)

Page-level UX decisions for the academic-OS landing. Grows each `/starci-fe-ux-apply`.

## 2026-07-03 — Bảng vàng = Podium + Grid, glass + gold-accent (direction B+C)
- **The fork:** old honor board rendered the legacy award POSTERS whole (name/laurel/
  confetti baked into the image) in 3 equal cards → inconsistent typography, gold noise,
  no hierarchy. Brainstormed 4 directions (Luxury-minimal / Podium+Grid / Glassmorphism /
  3D trading card); user chose **B+C combined** with A's "gold is an accent" rule.
- **Tiering:** `featured` achievers (3 GPA stars) on a podium row — visual order 2-1-3
  via `sm:order-*`, side cards pushed down with `sm:mt-6` (NOT translate — it would
  collide with the hover-lift transform). Rest in a compact 2/3-col grid below.
- **Text OUT of the image:** name = DOM text with a gold metallic `bg-clip-text`
  gradient built from `var(--warning)` + `color-mix` (theme-aware, crawlable); hero
  metric = the `highlight` string, first number counts up once on viewport entry
  (IntersectionObserver + rAF, reduced-motion → instant). Long highlights (>9 chars)
  drop to `text-2xl` + `whitespace-nowrap` to avoid ugly wraps.
- **Poster salvage:** the CDN images are 2480² posters with the name baked at y≈75%.
  Until clean portraits exist, `poster: true` triggers a circular face zoom-crop —
  `scale-[2.4]` + `origin-[50%_28%]` (faces measured at ~47–53% x, 31% y on the real
  files; the window 29–71% x / 16–58% y excludes the baked name and laurels). NB:
  square img in a square box means `object-cover` alone crops NOTHING — the zoom is
  what does the work. Tailwind v4 `scale-[…]` lands on the CSS `scale` property (check
  `computedStyle.scale`, not `transform`).
- **Material:** glass cards `bg-surface/60 backdrop-blur-md` + `border-separator`,
  hover `border-warning/40` + `shadow-warning/20` glow, over two ambient warning-orb
  divs (`blur-3xl`, `-z-10`, section `isolate`). Gold appears ONLY on name/metric/
  ring/chip — the restraint is the design.
- **Files:** `sections/HonorBoardSection.tsx`, `content.ts` (`featured`/`poster`
  flags). OpenSpec `honor-board-redesign`. tsc/eslint green; verified in preview
  (dark+light, desktop+mobile).

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
