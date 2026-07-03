## 1. Content + i18n

- [x] 1.1 i18n `homeLanding.{journey,stats,modules,offers,honor,mentors,faq,cta}.*` (vi/en) — journey stage labels/captions, stats labels + AI chips, module cards, ALL offer groups verbatim (Học viên mới / Lớp Live Zoom / Đăng ký nhóm / Học viên cũ / Vinh danh & Học bổng / Lộ trình sau khóa / Trả góp / Học thử), FAQ Q&A incl. refund, closing CTA; JSON valid + `tsc --noEmit`
- [x] 1.2 Typed content modules co-located per section: mentors (5 real mentors + quotes + avatar URLs + profile links, from old Ftes-frontend `src/views/home/components/mentor/index.tsx`), achievers (6 real entries from `.../achiver/index.tsx`), offer group structure, FAQ items — `npm run build` + `tsc --noEmit`

## 2. Stats "Số liệu thật"

- [x] 2.1 `useQueryPlatformStatsSwr` mock SWR hook (house pattern, BE `platformStats` assumption in comment, delayed mock resolve) — `tsc --noEmit`
- [x] 2.2 `PlatformStatsSection` — port StarCi StatStrip/useCountUp pattern: skeleton while loading, fallback values on error, first-in-view count-up with reduced-motion skip, locale thousands separator, AI-features chips row (static, always rendered) — `npm run build` + `tsc --noEmit`

## 3. 3D user-journey scene

- [x] 3.1 `blocks/marketing/UserJourneyScene` skeleton: client-only R3F canvas, journey `scene.json` (5 stations Home → Workplace → Course → Luyện tập/AI → Thành quả + edges + per-stage camera), theme-token colors, demand frameloop, DPR clamp, dispose on unmount — `npm run build` (webpack MUST stay green: three only behind `ssr:false` dynamic import) + `tsc --noEmit`
- [x] 3.2 Animated flow indicators along edges + "Thành quả" payoff emphasis (glow/success tone, dwell on final stage before loop) — `npm run build` + `tsc --noEmit`
- [x] 3.3 Stage stepper with captions + camera tween + active-station highlight; auto-advance with pause-on-hover/focus and stop-after-manual-select; labels passed as props (no next-intl inside canvas) — `npm run build` + `tsc --noEmit`
- [x] 3.4 `JourneyFallback` static SVG (same 5 stations, crawlable text) + fallback ladder: reduced-motion, `<lg` viewport, WebGL error boundary; dynamic-import `loading` uses the fallback (no layout shift); optional mobile scrollytelling variant (LearnLoopScroll pattern) only if cheap, static SVG is the baseline — `npm run build` + `tsc --noEmit`
- [x] 3.5 Wire into hero: `next/dynamic({ ssr:false })` + in-view mount gate; journey stage text always in DOM — `npm run build` + `tsc --noEmit`

## 4. Content sections

- [x] 4.1 `ModuleShowcaseSection` (Workplace / Course / Cộng đồng cards, icon+title+description, locale-aware links to each module) — `npm run build` + `tsc --noEmit`
- [x] 4.2 `OffersPolicySection` (grouped tabs/cards for 8 offer groups, verbatim copy, inactive panels hidden-not-unmounted for SEO, CTA → `/courses`) — `npm run build` + `tsc --noEmit`
- [x] 4.3 `HonorBoardSection` ("Bảng vàng FTES": real achievers with image+alt, name, achievement lines; image fallback; hidden when list empty; CTA → `/leaderboard`) — `npm run build` + `tsc --noEmit`
- [x] 4.4 `MentorTeamSection` (carousel/grid of 5 real mentors with quotes; keyboard-operable prev/next; no autoplay under reduced motion; avatar fallback) — `npm run build` + `tsc --noEmit`
- [x] 4.5 `FaqSection` (TruthList accordion shape, HeroUI `variant="surface"`; FTES Q&A incl. mandatory refund item; content in DOM regardless of expanded state) — `npm run build` + `tsc --noEmit`

## 5. Assembly + verify

- [x] 5.1 Compose section order in `HomeLanding` (hero+journey → stats → module showcase → offers → bảng vàng → mentors → FAQ → closing CTA), house spacing/gutters, semantic headings per section — `npm run build` + `tsc --noEmit`
- [x] 5.2 Sweep: vi/en switch on every section, keyboard pass (stepper/tabs/accordion/carousel/CTAs focusable, canvas not a trap), reduced-motion pass (static journey, no count-up, no carousel autoplay), mobile pass (no WebGL `<lg`), SSR HTML contains hero + journey text + all offer groups + FAQ text — then final `npm run build` (webpack) + `tsc --noEmit` + eslint clean
