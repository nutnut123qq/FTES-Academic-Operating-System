## Context

`HomeLanding` (`src/components/features/home-landing/HomeLanding/index.tsx`) today:
hero (Chip eyebrow · h1 · subline · 2 CTAs) → static bento (6 modules) → 3 pillars →
final CTA. No 3D, no data fetching. three + R3F + drei installed; the repo already
carries an unused copy of the StarCi `ArchitectureScene` block
(`src/components/blocks/marketing/ArchitectureScene/` — client-only R3F, data-driven
`scene.json`, theme-aware oklch→sRGB colors, compiles green under the webpack build)
and `TruthList` (HeroUI accordion `variant="surface"`, no indicator).

Prior art in the sibling repo `C:\NDH\FunnyCodeEdu\starci-academy` (FTES was
skeleton-stripped from it, so patterns port directly):

- `src/components/blocks/marketing/ArchitectureScene/` — R3F isometric scene,
  DATA-DRIVEN via `scene.json` (nodes/edges/camera), OrbitControls, `ssr:false`
  dynamic import + skeleton fallback, theme-aware colors.
- `src/components/features/landing/Landing/StatStrip/` + `useCountUp`
  (IntersectionObserver trigger, ease-out cubic 1500ms, reduced-motion respected,
  locale thousands separator, fallback values on error) +
  `src/hooks/swr/api/graphql/queries/useQueryPlatformStatsSwr.ts` (GraphQL
  `platformStats`).
- `src/components/blocks/marketing/TruthList/` — the "dark side of coding" accordion
  shape we repurpose for the FTES FAQ.
- `src/components/features/landing/Landing/LearnLoopScroll/` — framer-motion
  scroll-pinned 4-step scrollytelling; companion pattern for the journey narrative on
  mobile where 3D is hidden.
- `TrackCard`, KnowledgeGraph (d3-force) exist as further prior art (not used here).

Real content sources (old `C:\NDH\FunnyCodeEdu\Ftes-frontend`):
- Mentor quotes: `src/views/home/components/mentor/index.tsx` — Anh Khoa (Founder,
  CEO), Nhật Huy (Developer), Đức Hải (Co-Founder, CTO), Ngọc Hiếu (BrSE), Thanh Huy
  (Co-Founder, COO), each with a Vietnamese "chia sẻ" quote + avatar URL.
- Achievers: `src/views/home/components/achiver/index.tsx` — Kim Khoa (GPA
  9.35–9.42–9.1, Học Bá FA25), Hoàng Blue (GPA 9.4, Học Tốt + Học bổng Tài Năng),
  Hoàng Duy (GPA 9.6, Top 100 FPTU), Hồng Phúc, Phan Chi Thông, Trần Việt.

Constraints: FE-only (mock BE + recorded assumptions), house canon
(`starci-fe-cannon-apply` for all new code), `npm run build` = webpack (turbopack
build panics on this env), i18n vi/en mandatory (vi primary for promo copy), no
emojis in UI.

## Goals / Non-Goals

**Goals:**
- The 3D scene tells the OVERALL product journey and ends on the payoff: Home →
  Subject Workplace → Course → Luyện tập/AI → **Thành quả** (dự án, vinh danh,
  career).
- Trust layer with REAL content: số liệu thật, ưu đãi & chính sách verbatim, bảng
  vàng thật, mentor thật với quote thật, FAQ thật (incl. refund policy).
- Fast, crawlable, accessible; 3D is progressive enhancement only.

**Non-Goals:**
- No real BE endpoints (stats mocked; mentors/achievers/offers/FAQ are static
  content, not API-shaped).
- No checkout on the landing — CTAs route to `/courses`.
- No free-orbit 3D playground; the scene is a guided narrative.
- No removal of legacy `landing.*` i18n (separate cleanup).

## Page architecture (top → bottom)

1. `HeroSection` — text column (eyebrow/h1/subline/CTAs) + `UserJourneyScene`
   visual. On `lg:` side-by-side; below `lg:` the scene is replaced by the fallback.
2. `PlatformStatsSection` — "Số liệu thật, không phông bạt": 4 count-up stats
   (users, resources, courses, communities) + AI-features chips row.
3. `ModuleShowcaseSection` — journey detail: what's in Workplace / Course / Cộng
   đồng, cards linking to each module (evolves the existing bento).
4. `OffersPolicySection` — "Ưu đãi & chính sách": grouped tabs/cards with the exact
   FTES content (7 groups, see spec).
5. `HonorBoardSection` — "Bảng vàng FTES": real achievers, link to `/leaderboard`.
6. `MentorTeamSection` — "Đội ngũ FTES": mentor carousel with quotes.
7. `FaqSection` — FTES FAQ accordion (TruthList shape), incl. refund Q&A.
8. Existing final CTA (kept, copy refresh).

All sections are feature-owned compositions under
`features/home-landing/HomeLanding/`. Full-bleed bands with inner `max-w-6xl`
gutter, house spacing scale.

## Decisions

### D1 — 3D = journey narrative ending in the payoff
New block `blocks/marketing/UserJourneyScene/` following `ArchitectureScene`
conventions (`"use client"`, `/* eslint-disable react/no-unknown-property */`,
data-driven `scene.json`, theme-token colors). The `scene.json` schema is ADAPTED
from ArchitectureScene's nodes/edges/camera into a JOURNEY scene: **stations** =
Home → Subject Workplace → Course → Luyện tập/AI → Thành quả (project/badge/career),
**animated flow indicators** (pulses moving along edges) showing direction, and
per-stage camera targets. The final "Thành quả" station is visually emphasized —
larger, glow/success-tone material — because the story's point is the payoff.
Do NOT extend `ArchitectureScene` itself (its schema is a DAG-failure diagram);
shared style is convention-level. Colors read from theme tokens so light/dark work.

### D2 — Staged stepper, not scroll-jacking
Interaction = stage stepper (clickable stage list with captions + auto-advance
timer); camera tweens between stations, active station highlights, caption text
updates. Scroll hijacking (drei ScrollControls) inside a marketing page fights page
scroll and is an a11y/mobile hazard; a stepper is deterministic, keyboard-operable,
and mirrored 1:1 by the text fallback. Auto-advance pauses on hover/focus and stops
after manual selection. Stage labels/captions passed as props (Canvas never imports
next-intl).

### D3 — SSR safety + lazy loading (webpack-critical)
`next/dynamic(() => import(...UserJourneyScene), { ssr: false, loading: () =>
<JourneyFallback/> })`. three/R3F never enter the server bundle — this keeps the
webpack build green. Canvas mounts only when the hero is near the viewport
(IntersectionObserver gate) so the three chunk isn't fetched on first paint.

### D4 — Fallback ladder
`JourneyFallback` = static SVG illustration of the same 5 stations with crawlable
text labels. Renders when: (a) `prefers-reduced-motion: reduce`, (b) viewport `< lg`
(mobile), (c) WebGL unavailable / Canvas error boundary. Optionally on mobile the
journey may instead render as a `LearnLoopScroll`-style scrollytelling (framer-motion
scroll-pinned steps) — decided at implementation; the static SVG is the guaranteed
baseline and reduced-motion ALWAYS gets the static version. The journey TEXT (stage
names + captions) always renders in DOM regardless of visual — SEO and screen
readers never depend on WebGL.

### D5 — Performance budget
Frameloop `demand` with invalidation during tweens/flow-pulse ticks only; DPR
clamped `[1, 2]`; no postprocessing/shadows; flat-shaded materials; ≤ ~60 meshes;
three chunk lazy (D3); dispose on unmount. Hero text stays the LCP candidate.

### D6 — Stats = StarCi StatStrip pattern, mock SWR
Port the `StatStrip` + `useCountUp` pattern: `useQueryPlatformStatsSwr` in
`features/home-landing/hooks/` (SWR key + GraphQL-shaped mock resolver returning
`{ users, resources, courses, communities }`; **BE assumption in code comment**: a
public `platformStats` query will exist; mock resolves after a short delay so
loading states are real). Count-up: IntersectionObserver first-in-view trigger,
ease-out cubic ~1500ms, reduced-motion jumps straight to final value, locale
thousands separator, fallback values on error. Below the numbers, a chips row lists
the AI features (AI tutor chat, AI grading/feedback, recommendations) as plain text
chips — crawlable, no fetch.

### D7 — Offers/policy, mentors, achievers, FAQ = static typed content modules
Verbatim Vietnamese promo copy lives in i18n (`homeLanding.offers.*` etc.); the
structural data (group ordering, discount tiers, mentor roster with avatar URLs and
profile links, achiever entries with achievements) lives in typed `mocks.ts` /
`content.ts` co-located with each section. No fake API hooks — there is no plausible
near-term BE contract. Mentor avatars use the existing CDN URLs from old FE with the
house avatar-fallback pattern. Honor section links to `/leaderboard`
(`makeSimplePath`). Numbers/names are REAL content, not `ponytail:` placeholders.

### D8 — FAQ reuses the TruthList accordion shape
`FaqSection` uses the same component shape as `TruthList` (HeroUI Accordion
`variant="surface"`, no indicator, one item per Q&A). Content REPLACES StarCi's
"dark side of coding" concept with FTES's real Q&A derived from the promo/policy
content; the refund Q&A is mandatory (spec). Standalone marketing band → `surface`
variant per the accordion-surface rule.

### D9 — Offers section layout: grouped tabs on desktop, stacked cards on mobile
7 content groups (Học viên mới / Lớp Live Zoom / Đăng ký nhóm / Học viên cũ / Vinh
danh & Học bổng / Trả góp / Học thử & ưu đãi theo test / Lộ trình sau khóa — grouped
per spec) are too much for one wall of cards. Desktop: HeroUI Tabs (icon+label; per
house rule labels hide `<sm`) with card grids per tab. Mobile fallback: tabs
collapse per the tabs-mobile rule. All copy crawlable (tabs render content in DOM;
SEO covered because all groups' copy exists in the HTML — verify at implementation;
if HeroUI Tabs unmounts inactive panels, keep panels mounted via CSS hidden).

### D10 — i18n
Everything under `homeLanding.*` (vi/en) — subtrees `journey.*`, `stats.*`,
`modules.*`, `offers.*`, `honor.*`, `mentors.*`, `faq.*`, `cta.*`. Vietnamese is the
primary/verbatim source for promo copy; English is a faithful translation. No
hardcoded strings; scene stage labels passed into the Canvas as props.

## Risks / Trade-offs

- [three in webpack server bundle breaks build] → only entry is `ssr:false` dynamic
  import; every task ends with `npm run build` + `tsc --noEmit`.
- [3D degrades LCP] → hero text renders immediately; Canvas lazy + in-view gated;
  fallback is lightweight SVG.
- [Motion overload: count-up + flow pulses + carousel] → all honor
  `prefers-reduced-motion`; one animated hero element above the fold.
- [Verbatim promo copy drifts from business reality] → copy centralized in i18n +
  one content module per section; single place to update.
- [Mentor avatar CDN links rot] → house avatar fallback (initials placeholder) on
  image error.
- [Tabs hide offer content from crawlers] → keep panels in DOM (CSS-hidden) or use
  grouped headings; verify SSR HTML contains all offer text.

## Open Questions

- Real platform numbers (users/resources/courses/communities) — mock values until
  FTES provides; labeled honestly in copy.
- Whether mobile journey uses static SVG only or SVG + scrollytelling (D4) — decide
  at implementation by build size/effort; spec requires only the static baseline.
- Whether `ArchitectureScene` (unused copy) gets deleted — untouched here.
