## Context

`HomeLanding` (`src/components/features/home-landing/HomeLanding/index.tsx`) today:
hero (Chip eyebrow · h1 · subline · 2 CTAs) → static bento (6 modules) → 3 pillars →
final CTA. Footer comes from `InnerLayout`. No 3D on the page, no data fetching —
pure static i18n. three.js + R3F + drei are installed; the orphan block
`src/components/blocks/marketing/ArchitectureScene/` (client-only R3F, theme-token
colors, data-driven JSON scene) already compiles under the webpack build, so the
toolchain risk is retired. There is no `home-landing` spec in `openspec/specs/`.

Constraints: FE-only (mock BE + recorded assumptions), house canon
(`starci-fe-cannon-apply` for all new code), `npm run build` = webpack (turbopack
build panics on this env), i18n vi/en mandatory, no emojis in UI.

## Goals / Non-Goals

**Goals:**
- Landing tells the user-flow STORY (Đăng ký → Workplace → Course → Luyện tập/AI →
  Cộng đồng → Vinh danh/Career) with a 3D scene as the hero visual.
- Add trust layer: platform stats, AI showcase, team, honor board, purchase + policy.
- Keep the page fast, crawlable, accessible; 3D is progressive enhancement only.

**Non-Goals:**
- No real BE endpoints (stats/team/honor are mocks with assumptions noted).
- No checkout flow on the landing — purchase CTA routes to `/courses`.
- No free-orbit 3D playground; the scene is a guided narrative, not a toy.
- No removal of legacy `landing.*` i18n (separate cleanup, unchanged from v1).

## Page architecture (top → bottom)

1. `HeroSection` — text column (eyebrow/h1/subline/CTAs, unchanged copy source) +
   `UserFlowScene` visual. On `lg:` side-by-side; below `lg:` the scene collapses to
   the static fallback illustration.
2. `PlatformStatsStrip` — 4 count-up stats (users, resources, courses, communities).
3. Existing bento grid (kept — it IS the "modules" tour) — light copy touch only.
4. `AiShowcaseSection` — AI tutor chat, AI grading, recommendations; icon cards +
   crawlable descriptions.
5. Existing pillars band (kept).
6. `TeamSection` — FTES team grid (avatar, name, role).
7. `HonorBoardSection` — "Bảng vàng FTES": top learners, link to `/leaderboard`.
8. `PurchasePolicySection` — pricing CTA to `/courses` + policy list (hoàn tiền,
   hỗ trợ, truy cập trọn đời).
9. Existing final CTA (kept).

All sections are feature-owned compositions under
`features/home-landing/HomeLanding/` (a landing is bespoke; feature owns copy +
navigation, tokens/HeroUI own the look). Full-bleed bands with inner `max-w-6xl`
gutter, house spacing scale.

## Decisions

### D1 — 3D = staged narrative, not scroll-jacking
The scene shows the 6 journey stages as connected 3D "stations" (isometric slabs on a
board, same visual language as `ArchitectureScene`). Interaction = a stage stepper
(clickable stage list + auto-advance timer); camera tweens between stations and the
active station highlights. **Why not scroll-driven** (drei `ScrollControls`): scroll
hijacking inside a normal marketing page fights page scroll, is a known a11y/mobile
hazard, and couples the scene to viewport height. A stepper is deterministic,
keyboard-operable, and trivially mirrored by the text fallback. Alternative
considered: full-page scroll narrative — rejected as out of proportion for one hero.

### D2 — Scene implementation + reuse
New block `blocks/marketing/UserFlowScene/` following `ArchitectureScene` conventions:
`"use client"`, `/* eslint-disable react/no-unknown-property */` for R3F files,
data-driven `scene.json` (stations, edges, camera per stage), colors read from theme
tokens (`--default`, `--accent`, `--muted`) so light/dark both work. Do NOT extend
`ArchitectureScene` itself — its schema is a DAG-failure diagram; forcing a journey
into it would bloat both. Shared style is convention-level, not code-level.

### D3 — SSR safety + lazy loading
`next/dynamic(() => import(...UserFlowScene), { ssr: false, loading: () => <SceneFallback/> })`
from the hero. three/R3F therefore never enter the server bundle — this is what keeps
the **webpack** build green (three's ESM in server context is the classic breakage).
Additionally the Canvas mounts only when the hero is near the viewport
(IntersectionObserver gate) so the three chunk isn't fetched on first paint.

### D4 — Fallback ladder (one static component, three triggers)
`SceneFallback` = static illustration of the same 6 stages (SVG/CSS, crawlable text
labels). It renders when: (a) `prefers-reduced-motion: reduce` (via
`useReducedMotion`), (b) viewport `< lg` (mobile — battery/GPU + touch conflicts),
(c) WebGL unavailable / Canvas error boundary. The narrative TEXT (stage names +
one-liners) always renders in DOM regardless of which visual shows — SEO and screen
readers never depend on WebGL.

### D5 — Performance budget
Frameloop `demand` (invalidate on tween/hover only); DPR clamped `[1, 2]`; no
postprocessing, no shadows, flat-shaded materials (matches ArchitectureScene style);
geometry count ≤ ~60 meshes; three chunk loaded lazily (see D3); scene disposes on
unmount. Target: no measurable main-thread jank on scroll, Lighthouse perf on the
route stays within a few points of the pre-change baseline.

### D6 — Platform stats = mock SWR, house pattern
`useQueryPlatformStatsSwr` in `features/home-landing/hooks/`, mirroring
`useQueryWorkflowSwr` (SWR key + GraphQL-shaped mock resolver returning
`{ users, resources, courses, communities }`). **BE assumption recorded in code
comment**: a public (unauthenticated) `platformStats` query will exist; until then the
mock resolves static numbers after a short delay so loading states are real.
Count-up animates 0→value on first in-view (respecting reduced motion: jump straight
to final value); values formatted with locale-aware compact notation.

### D7 — Team / honor / policy = static mock modules
Small typed mock arrays co-located with their sections (`mocks.ts`), not fake API
hooks — there is no plausible near-term BE contract for "team", and honor board reuses
the leaderboard domain later. Honor entries link to `/leaderboard` (route exists via
`makeSimplePath("leaderboard")`). Policy items are pure i18n content. Avatars use
existing avatar assets/placeholder pattern.

### D8 — i18n
Everything under `homeLanding.*` (vi/en) — new subtrees `flow.*`, `stats.*`, `ai.*`,
`team.*`, `honor.*`, `purchase.*`. No hardcoded strings, including scene stage labels
(passed into the 3D scene as props so the Canvas never imports next-intl).

## Risks / Trade-offs

- [three in webpack server bundle breaks build] → `ssr: false` dynamic import is the
  only entry point; task list ends every step with `npm run build` + `tsc --noEmit`.
- [3D scene degrades LCP] → hero text is the LCP candidate (renders immediately);
  Canvas is lazy + in-view gated; fallback is lightweight SVG.
- [Count-up + 3D both animate → motion overload] → both honor
  `prefers-reduced-motion`; only one animated hero element (scene) above the fold.
- [Mock stats read as fake marketing numbers] → copy labels them honestly
  ("đang phát triển" tone decided at copy time); numbers centralized in one mock.
- [Stepper auto-advance annoys users] → pauses on hover/focus/interaction, stops
  permanently after manual stage selection.

## Open Questions

- Real platform numbers / team roster / honor list — placeholder until FTES provides
  content (mock values marked `ponytail:`).
- Whether `ArchitectureScene` gets deleted or shipped elsewhere — untouched here.
