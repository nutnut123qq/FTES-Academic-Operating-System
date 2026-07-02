## 1. Copy + mocks

- [ ] 1.1 i18n `homeLanding.{flow,stats,ai,team,honor,purchase}.*` (vi/en) — stage labels/descriptions, stats labels, AI cards, team roles, honor copy, policy items; JSON valid + `tsc --noEmit` clean
- [ ] 1.2 Typed mock data: team members + honor entries (`mocks.ts` co-located, `ponytail:` markers for real content) — `npm run build` + `tsc --noEmit`

## 2. Platform stats

- [ ] 2.1 `useQueryPlatformStatsSwr` mock SWR hook (house pattern, BE `platformStats` assumption in comment, delayed mock resolve) — `tsc --noEmit`
- [ ] 2.2 `PlatformStatsStrip` — skeleton while loading, hide on error/empty, in-view count-up with reduced-motion skip, locale number formatting — `npm run build` + `tsc --noEmit`

## 3. 3D user-flow scene

- [ ] 3.1 `blocks/marketing/UserFlowScene` skeleton: client-only R3F canvas, `scene.json` (6 stations + edges + per-stage camera), theme-token colors, demand frameloop, DPR clamp, dispose on unmount — `npm run build` (webpack MUST stay green: three only behind `ssr:false` dynamic import) + `tsc --noEmit`
- [ ] 3.2 Stage stepper + camera tween + active-station highlight; auto-advance with pause-on-hover/focus and stop-after-manual-select; labels passed as props (no next-intl inside canvas) — `npm run build` + `tsc --noEmit`
- [ ] 3.3 `SceneFallback` static illustration (same 6 stages, crawlable text) + fallback ladder: reduced-motion, `<lg` viewport, WebGL error boundary; dynamic-import `loading` uses the fallback (no layout shift) — `npm run build` + `tsc --noEmit`
- [ ] 3.4 Wire into hero: `next/dynamic({ ssr:false })` + in-view mount gate; journey stage text always in DOM — `npm run build` + `tsc --noEmit`

## 4. Trust sections

- [ ] 4.1 `AiShowcaseSection` (cards: tutor chat, AI grading, recommendations) — `npm run build` + `tsc --noEmit`
- [ ] 4.2 `TeamSection` (avatar+alt, name, role, placeholder avatar fallback, responsive grid) — `npm run build` + `tsc --noEmit`
- [ ] 4.3 `HonorBoardSection` ("Bảng vàng FTES": avatar, name, achievement; CTA → `/leaderboard`; hidden when list empty) — `npm run build` + `tsc --noEmit`
- [ ] 4.4 `PurchasePolicySection` (primary CTA → `/courses`; policy items hoàn tiền / hỗ trợ / truy cập trọn đời) — `npm run build` + `tsc --noEmit`

## 5. Assembly + verify

- [ ] 5.1 Compose section order in `HomeLanding` (hero+scene → stats → bento → AI → pillars → team → honor → purchase → final CTA), house spacing/gutters, semantic headings per section — `npm run build` + `tsc --noEmit`
- [ ] 5.2 Sweep: vi/en switch on every section, keyboard pass (stepper + CTAs focusable, canvas not a trap), reduced-motion pass (static scene, no count-up), mobile pass (fallback shows `<lg`), SSR HTML contains all section text — then final `npm run build` (webpack) + `tsc --noEmit` + eslint clean
