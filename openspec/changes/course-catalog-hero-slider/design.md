## Context
`CourseCatalog` (`src/components/features/course/CourseCatalog/index.tsx`) renders search + level filter + 3-col grid directly; no hero. Mock SWR pattern established by `useQueryCoursesSwr`. Dependency audit: package.json has NO embla/swiper/keen-slider; HeroUI v3.1 ships no Carousel primitive; no carousel block exists in `src/components/blocks|reuseable` (only ad *types* mention carousel). framer-motion v12 and `usehooks-ts` are already installed.

## Goals / Non-Goals
**Goals:** featured hero slider at top of `/courses`; autoplay + pause-on-hover/focus; dots + arrows; swipe; keyboard; reduced-motion; skeleton; empty→hide; i18n vi/en; a11y carousel pattern; catalog below untouched.
**Non-Goals:** real BE featured endpoint; CMS/admin curation; slider reuse elsewhere (extract to a block later if a 2nd consumer appears); vertical/thumbnail carousels.

## Decisions
- **No new dependency — native CSS scroll-snap track + small `useCarousel` hook.** Track = `overflow-x-auto snap-x snap-mandatory` with full-width `snap-center` slides; swipe/momentum is free and native on touch; arrows/dots/autoplay call `scrollTo({ behavior: "smooth" })`; active index tracked via IntersectionObserver (or scroll position). Alternatives: `embla-carousel-react` (the usual choice — rejected: adds a dep for one 3–5-slide hero, against "prefer existing"); framer-motion drag carousel (rejected: reimplements physics scroll-snap gives free, JS-drag hurts a11y). If loop/advanced behavior is later required, swap the hook internals for embla behind the same component API.
- **Component plan (on house canon):** feature-local children under `CourseCatalog/`: `FeaturedSlider/index.tsx` (region, autoplay timer, reduced-motion gate), `FeaturedSlide` (one slide), `FeaturedSliderSkeleton`. Hook `useQueryFeaturedCoursesSwr.ts` in `../hooks` mirrors `useQueryCoursesSwr` (deterministic mock, 4 items, `FeaturedCourse = Course + { pitch, priceVnd, coverUrl }`, key `["featured-courses"]`).
- **Slide visual:** full-width card, `aspect-video` (16:9) on mobile capped to `md:aspect-[21/9]` + `max-h` on desktop; cover via `next/image` `fill` + `object-cover` (mock covers = gradient/`picsum` placeholder); bottom-left overlay gradient carrying code/title/level chip/price/pitch/CTA (HeroUI `Button`, Link to `/courses/[id]`; enroll wording per house rule — no "buy/VIP").
- **Autoplay:** 5s interval; cleared on hover, focus-within, document hidden, and entirely disabled when `prefers-reduced-motion: reduce` (usehooks-ts `useMediaQuery`) or slide count < 2.
- **A11y (WAI-ARIA carousel):** wrapper `role="region"` + `aria-roledescription="carousel"` + localized `aria-label`; slides `role="group"` + `aria-roledescription="slide"` + `aria-label` "i/N"; dots = buttons with `aria-label` + current state; arrows = icon buttons with `aria-label`; ArrowLeft/ArrowRight on focused region navigate.
- **Skeleton:** HeroUI `Skeleton` mirroring the real box (same aspect ratio + dot row) per house skeleton rule, gated on `isLoading || !data`; error or empty list → render nothing (catalog still works).

## Risks / Trade-offs
- [Scroll-snap `scrollTo` smooth-scroll quirks on some browsers] → guard with rAF/`scrollLeft` fallback; behavior "auto" under reduced motion.
- [No loop (snap track is linear)] → next on last slide wraps by scrolling to index 0; acceptable for 3–5 slides.
- [Hand-rolled hook vs battle-tested lib] → scope is tiny (index, scrollTo, autoplay); if it grows, migrate internals to embla without API change (logged as the escape hatch).
- [Mock covers may 404 offline] → CSS gradient fallback behind the image.

## Open Questions
- None blocking. Featured selection rule (manual flag vs top-N) is BE's call later; mock hard-codes 4.
