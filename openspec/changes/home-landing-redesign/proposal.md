## Why

The current landing (`features/home-landing/HomeLanding`, direction A: hero + static
bento + pillars + CTA) shows WHAT the platform has but not the user's JOURNEY through
it, and it carries zero social proof. User request (2026-07-02, translated): *"Redo the
3D part to reflect the meaning of the user's usage flow on the landing page. Show how
many people use the site, how many resources, courses, communities; the AI features;
the FTES team; a gold board honoring FTES learners; and buy-our-course + course
policy."* three.js / @react-three/fiber / @react-three/drei are already installed and
an unused `ArchitectureScene` block proves R3F builds green under webpack — but no 3D
is on the page today.

## What Changes

- **Hero + 3D user-flow scene**: replace the static hero visual with an R3F scene that
  narrates the user journey — Đăng ký → Subject Workplace → Course → Luyện tập/AI →
  Cộng đồng → Vinh danh/Career — as staged interaction (stage stepper, not free orbit).
  Client-only (dynamic import, `ssr: false`), lazy-loaded, reduced-motion + mobile
  static fallbacks, explicit performance budget.
- **Platform stats strip**: users / resources / courses / communities counts via a new
  mock SWR hook `useQueryPlatformStatsSwr` (BE contract assumed, mock data), animated
  count-up, skeleton while loading.
- **AI features showcase**: section presenting the AI capabilities (tutor chat,
  AI grading, recommendations) as crawlable text + cards.
- **FTES team section**: mock team members (name, role, avatar).
- **"Bảng vàng FTES" honor section**: top learners (avatar, name, achievement),
  linking to `/leaderboard`.
- **Course purchase + policy section**: pricing CTA into `/courses` plus course
  policy items (hoàn tiền, hỗ trợ, truy cập trọn đời) as mock i18n content.
- New i18n keys under `homeLanding.*` (vi/en) for every new section; existing hero /
  bento / pillars copy is extended, not discarded — bento + pillars remain as the
  "product tour" between hero and the new sections.

## Capabilities

### New Capabilities
- `home-landing`: the marketing landing page — hero with 3D user-flow scene, platform
  stats, AI showcase, team, honor board, purchase + policy sections. (The prior
  `home-landing` change was archived without a spec, so this creates the capability
  spec fresh, covering old + new behavior.)

### Modified Capabilities
- (none — no existing spec in `openspec/specs/` covers the landing)

## Impact

- FE only: `src/components/features/home-landing/*`, a new 3D scene component
  (client-only), new mock SWR hook + GraphQL-shaped mock for platform stats, mock data
  for team/honor/policy, i18n `homeLanding.*` (vi/en). No real BE — all data mocked
  with assumptions recorded (per CLAUDE.md FE-only rule).
- Dependencies: three / @react-three/fiber / @react-three/drei already in
  `package.json`; no new packages.
- Build: `npm run build` uses **webpack** (`next build --webpack`); the 3D module must
  stay dynamically imported with `ssr: false` so three never runs in the server
  bundle. `ArchitectureScene` block already proves R3F compiles green here.
- SEO: the journey narrative must also exist as crawlable text; 3D is progressive
  enhancement.
