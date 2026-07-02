## 1. Category model + data hook (BE swap seam)

- [x] 1.1 Add `CourseCategory` type (`{ id; slug; name: { vi; en }; icon; accent }`) and a `useQueryCourseCategoriesSwr` mock hook returning the three seed categories (`math`/Toán, `programming`/Lập trình, `foreign-languages`/Ngoại ngữ), SWR-keyed, per the existing `useQueryFeaturedCoursesSwr` mock pattern; document the BE-swap point in the hook.
- [x] 1.2 Extend the `Course` type + `useQueryCoursesSwr` mock: add `category` (slug) to every course, plus card-anatomy fields `rating?`, `ratingCount?`, `durationHours?`, `priceVnd?`, `badge?`; assign each mock course to one category.
- [x] 1.3 Add helper selectors (e.g. `coursesByCategory(slug)`, sort comparators for `popular`/`newest`/`rating`).

## 2. Shared course card

- [x] 2.1 Build the shared catalog `CourseCard` (mock-`Course`-bound): cover + branded fallback, title, level chip, rating + rating count, duration/credits, VND price via `PriceTag`, optional badge (Bán chạy / Mới), save toggle that does not navigate; links to course detail. Fields degrade gracefully.
- [x] 2.2 Build `CourseCardSkeleton` mirroring the card box (cover + text rows).

## 3. Chip bar + facet/sort bar

- [x] 3.1 Build `CategoryChipBar` (All + one chip per category) as an ARIA tablist, horizontally scrollable on mobile, marking the active chip selected; selecting a chip jumps/filters the browse view.
- [x] 3.2 Build the facet + sort bar: keep search (across all categories, code+name) and level filter; add sort control (`popular` default / `newest` / `rating`).

## 4. Category shelves

- [x] 4.1 Build `CategoryShelf`: section header (icon + localized name + "Xem tất cả" link to `/courses/category/[slug]`) over a `useCarousel` scroll-snap track of `CourseCard`s; horizontal scroll/swipe; NO autoplay; carousel region + prev/next controls labelled.
- [x] 4.2 Build `CategoryShelfSkeleton` (header bar + row of `CourseCardSkeleton`).

## 5. Redesign `/courses` catalog

- [x] 5.1 Recompose `CourseCatalog`: keep `FeaturedSlider` on top, then `CategoryChipBar` → facet+sort bar → one `CategoryShelf` per non-empty category (hide empty categories); when search/facet is active, render a filtered grid of shared cards instead of shelves.
- [x] 5.2 Wire loading state to shelf skeletons (gate on `isLoading || !data`; keep static chrome out of the skeleton).

## 6. Category landing page

- [x] 6.1 Add route `/courses/category/[slug]` rendering `CategoryPage`: header (localized name, description, count), facet+sort bar, responsive grid of shared cards; empty state; unknown slug → not-found; server-crawlable content.
- [x] 6.2 Add `CategoryGridSkeleton` mirroring the grid.

## 7. i18n

- [x] 7.1 Add `courseSystem.categories.*` and `courseSystem.browse.*` keys (category names, "Xem tất cả", sort labels, badge labels, empty states, facet labels) for both `vi` and `en`; no hard-coded strings.

## 8. Verify

- [x] 8.1 Manually verify a11y (carousel region + prev/next `aria-label`, chip tablist `aria-selected`, card alt text) and both locales.
- [x] 8.2 Run `npx tsc --noEmit` and fix any type errors. (Webpack build `npm run build` is batch-verified by the orchestrator.)
