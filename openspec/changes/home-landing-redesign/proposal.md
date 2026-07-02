## Why

The current landing (`features/home-landing/HomeLanding`: hero + static bento +
pillars + CTA) shows WHAT the platform has but not the user's JOURNEY through it,
carries zero social proof, and none of FTES's real commercial content (ưu đãi, chính
sách, đội ngũ, bảng vàng). Product owner confirmed direction (2026-07-02):

1. **3D = hành trình dùng web tổng quan nhất** — the 3D scene narrates the product
   journey Home → Subject workplace → Course → chốt hạ là THÀNH QUẢ (dự án, vinh
   danh, career). The payoff ends the story.
2. **Stats section** modeled on StarCi's "Real data, no fluff": số người dùng, số
   resource, số khóa học, số cộng đồng, các tính năng AI.
3. **FAQ FTES** replaces StarCi's "The dark side of coding" — accordion of real FTES
   questions/answers, including the refund Q&A (hoàn 100% học phí sau buổi đầu nếu
   KHÔNG HIỂU / KHÔNG HỢP CÁCH GIẢNG / KHÔNG HIỆU QUẢ, kèm điều kiện chuyên cần).
4. **Ưu đãi & chính sách** with real, verbatim FTES promo content (học viên mới, học
   viên cũ, đăng ký nhóm, trả góp, học thử, vinh danh & học bổng, lộ trình sau khóa).
5. **Đội ngũ FTES** — real mentors with their "chia sẻ" quotes (from old
   Ftes-frontend).
6. Keep from v1 where compatible: Bảng vàng FTES (real achievers from old FE),
   reduced-motion/mobile/SEO/i18n/a11y requirements, mock SWR platform stats.

three / @react-three/fiber / @react-three/drei are installed and the unused
`ArchitectureScene` block proves R3F builds green under webpack.

## What Changes

- **Hero + 3D User Journey scene**: R3F scene narrating Home → Subject Workplace →
  Course → Luyện tập/AI → **Thành quả** (dự án, vinh danh, career) as staged stations
  with animated flow indicators; stepper captions; the final "Thành quả" station is
  visually emphasized (glow/success tone). Client-only (`ssr: false`), lazy, with
  static-SVG / scrollytelling fallback for mobile and reduced motion.
- **Stats strip "Số liệu thật"**: users / resources / courses / communities count-up
  via new mock SWR hook `useQueryPlatformStatsSwr` + a row of AI-feature chips.
- **Journey detail / module showcase**: what's inside Workplace, Course, Community —
  cards linking to each module (replaces v1's separate "AI showcase" section; AI
  features live in the stats chips + journey copy).
- **Ưu đãi & chính sách section**: tabbed/grouped cards carrying the exact FTES promo
  content (7 groups), vi primary.
- **Bảng vàng FTES**: real achievers (Kim Khoa, Hoàng Blue, Hoàng Duy, Hồng Phúc,
  Phan Chi Thông, Trần Việt) with achievements; link to `/leaderboard`.
- **Đội ngũ FTES**: mentor carousel/grid — Anh Khoa (Founder, CEO), Đức Hải
  (Co-Founder, CTO), Thanh Huy (Co-Founder, COO), Nhật Huy (Developer), Ngọc Hiếu
  (BrSE) — each with their real quote.
- **FAQ accordion**: FTES Q&A built from the promo/policy content, MUST include the
  refund question; accordion reuses the `TruthList` component shape.
- **Closing CTA** kept as final section.
- New i18n keys under `homeLanding.*` (vi/en) for every section.

## Capabilities

### New Capabilities
- `home-landing`: the marketing landing page — hero with 3D user-journey scene,
  "Số liệu thật" stats, module showcase, ưu đãi & chính sách, bảng vàng, đội ngũ,
  FAQ, closing CTA. (The prior `home-landing` change was archived without a spec, so
  this creates the capability spec fresh.)

### Modified Capabilities
- (none — no existing spec in `openspec/specs/` covers the landing)

## Impact

- FE only: `src/components/features/home-landing/*`, new 3D journey scene block
  (client-only), mock SWR hook for platform stats, static typed mocks for mentors /
  achievers / offers / FAQ, i18n `homeLanding.*` (vi/en). No real BE — mocks with
  assumptions recorded (per CLAUDE.md FE-only rule).
- Dependencies: three / R3F / drei already in `package.json`; no new packages.
- Build: `npm run build` is **webpack** (`next build --webpack`); the 3D module stays
  behind `next/dynamic({ ssr: false })` so three never enters the server bundle.
- SEO: journey narrative, offers, FAQ, mentor quotes all exist as crawlable DOM text;
  3D is progressive enhancement only.
