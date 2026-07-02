## 1. Data

- [x] 1.1 Add `useQueryFeaturedCoursesSwr.ts` in `src/components/features/course/hooks/` — `FeaturedCourse` type (`Course` + pitch, priceVnd, coverUrl), deterministic 4-item mock, SWR key `["featured-courses"]`, returns `{ featured, isLoading, error }` (mirror `useQueryCoursesSwr`)

## 2. Slider components

- [x] 2.1 `CourseCatalog/FeaturedSlider/useCarousel.ts` — scroll-snap track control: active index (IntersectionObserver/scroll), `scrollToIndex`, next/prev with wrap, 5s autoplay timer paused on hover/focus-within/document-hidden, disabled under `prefers-reduced-motion` or <2 slides
- [x] 2.2 `FeaturedSlide` — cover `next/image fill` + gradient fallback, code/title, level chip, VND-primary price, pitch, CTA Link to `/courses/[id]` (enroll wording, no "buy/VIP")
- [x] 2.3 `FeaturedSlider/index.tsx` — snap track + prev/next arrows + dots; ArrowLeft/ArrowRight keyboard nav; ARIA carousel semantics (region + roledescription, slides `group` "i/N", labeled buttons, selected dot)
- [x] 2.4 Fallbacks — 1 slide: static hero (no arrows/dots/autoplay); 0 slides or error: render null
- [x] 2.5 `FeaturedSliderSkeleton` — HeroUI Skeleton mirroring hero aspect ratio + dot row, gated on `isLoading || !data`

## 3. Integration & i18n

- [x] 3.1 Mount `FeaturedSlider` at the top of `CourseCatalog/index.tsx`, above title/search/filter/grid — nothing below changes
- [x] 3.2 i18n `courseSystem.featured.*` (region label, slide label, prev/next, goToSlide, cta) in `vi` + `en` message files

## 4. Verify

- [x] 4.1 Manual pass per spec scenarios: autoplay/pause, arrows/dots, swipe (mobile viewport), keyboard, reduced-motion, 1-slide/empty, skeleton, vi/en
- [x] 4.2 `npm run build` (webpack) green + `tsc --noEmit` clean — tsc clean; build: batch-verified by orchestrator
