## Why
`/courses` opens flat (search + filter + grid) with zero merchandising — no place to promote featured/flagship courses. A hero slider at the top gives the catalog a promotional surface ("Course — có slider ở đầu").

## What Changes
- Add a full-width featured-courses hero slider at the TOP of `/courses` (`CourseCatalog`), above the existing search/filter/grid (which stay unchanged).
- Each slide: cover image, course title + code, level chip, price, short pitch, CTA linking to `/courses/[id]`.
- Autoplay with pause-on-hover/focus, dots + prev/next arrows, touch swipe, keyboard nav, `prefers-reduced-motion` disables autoplay.
- New mock hook `useQueryFeaturedCoursesSwr` (3–5 slides, SWR-shaped for BE swap); loading skeleton; section hidden when list is empty.
- No new dependency: carousel built on native CSS scroll-snap + a small hook (framer-motion already available if needed). Justified in design.md.
- i18n `courseSystem.featured.*` (vi/en); WAI-ARIA carousel pattern.

## Capabilities

### New Capabilities
- `course-featured-slider`: featured-courses hero carousel on the course catalog page (autoplay, manual nav, swipe, a11y, loading/empty states).

### Modified Capabilities
<!-- none — no existing spec in openspec/specs covers the catalog page; catalog behavior below the slider is unchanged -->

## Impact
- FE only, mock BE. `src/components/features/course/CourseCatalog/` (new `FeaturedSlider` child + mount at top), `src/components/features/course/hooks/` (new SWR mock hook), i18n messages vi/en.
- No changes to existing catalog search/filter/grid, course detail, or routing. No new npm dependency. Build must stay green (`npm run build` webpack + `tsc --noEmit`).
