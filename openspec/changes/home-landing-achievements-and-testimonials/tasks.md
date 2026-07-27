# Tasks — home-landing-achievements-and-testimonials

## 1. Shared carousel primitive

- [x] 1.1 Move `FeaturedSlider/useCarousel.ts` → `src/components/blocks/carousel/useCarousel.ts`
      (block tier); add `intervalMs` option (default `AUTOPLAY_INTERVAL_MS`).
- [x] 1.2 Repoint hero slider (`FeaturedSlider/index.tsx`) + category shelf
      (`browse/CategoryShelf/index.tsx`) to the shared import; delete the old local hook.

## 2. Mascot hero sign-off

- [x] 2.1 `JourneyHero`: move `<HomeMascotGreeting />` from the top of the text column to
      BELOW the stage stepper.
- [x] 2.2 `HomeMascotGreeting`: `size` `md` → `sm`; update doc comment (sign-off, not top banner).

## 3. Thành tựu (achievements) section

- [x] 3.1 `content.ts`: replace `ModuleCard`/`MODULE_CARDS` with `AchievementStat`/`ACHIEVEMENTS`
      — 6 real FTES awards/milestones as `{ key, value }` (rank/percentage strings, language-neutral).
- [x] 3.2 Add `AchievementsSection.tsx` — icon + award headline (`value`) + i18n label per card,
      mirroring the neighbouring section rhythm (`max-w-6xl` · `py-16` · centered heading);
      delete `ModuleShowcaseSection.tsx`.
- [x] 3.3 `HomeLanding/index.tsx`: swap `<ModuleShowcaseSection />` → `<AchievementsSection />`.

## 4. Đội ngũ (testimonials) carousel

- [x] 4.1 `content.ts`: replace `FOUNDER` with `Testimonial`/`TESTIMONIALS` — 5 real mentors
      (founder first) `{ key, avatarUrl, profileUrl, github?, linkedin?, facebook? }`; upgrade
      Ngọc Hiếu avatar to https (avoid mixed-content block).
- [x] 4.2 Rebuild `MentorTeamSection` as a carousel on `useCarousel` (~6s): quote card + byline
      slides, prev/next arrows + dots, wrap, pause on hover/focus-within/hidden-tab/reduced-motion.
- [x] 4.3 A11y: labeled `role="region"` `aria-roledescription="carousel"`, ArrowLeft/ArrowRight on
      the region, `aria-live` off while autoplaying, labeled controls + `aria-current` dot.

## 5. i18n

- [x] 5.1 `messages/{en,vi}.json`: add `homeLanding.achievements.*` and `homeLanding.mentors.quotes.*`
      + carousel control labels; remove obsolete `mentors.founder` / `mentors.blog`.

## 6. Verify

- [x] 6.1 `npx tsc --noEmit` clean.
- [x] 6.2 `npm run build` (webpack) green.
