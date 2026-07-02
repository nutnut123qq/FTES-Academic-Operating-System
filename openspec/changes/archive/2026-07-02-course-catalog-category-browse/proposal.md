## Why

The `/courses` catalog is too basic — a flat search + level filter + 3-column grid — and does not help learners discover courses the way Coursera/Udemy do (browse by subject, per-category shelves, rich course cards). The product owner wants courses organised by category (Toán / Lập trình / Ngoại ngữ now; BE-owned categories later) and a browse experience closer to Coursera/Udemy.

## What Changes

- Add a **category** dimension to the course model + mock data. Seed three frontend-defined, BE-ready categories now: **Toán** (Math), **Lập trình** (Programming), **Ngoại ngữ** (Foreign Languages). Every mock course gets exactly one category.
- Add a `useQueryCourseCategoriesSwr` mock hook returning `[{ id, slug, name{vi,en}, icon/accent }]`, SWR-shaped as a drop-in seam for a future BE category endpoint.
- **Redesign `/courses` as a browse-by-category catalog**: keep the featured hero slider at the top, then render one horizontal carousel ("kệ" / shelf) per category — reusing the existing scroll-snap `useCarousel` primitive (NO new dependency) — each with a section header (name + icon + "Xem tất cả" link). Add a category chip/tab bar for quick jump/filter. Keep search + level filter but elevate them into a facet bar with a sort control (phổ biến / mới / đánh giá).
- **New category landing page** at `/courses/category/[slug]`: header (name, description, count), facet filters, full grid of that category's courses, empty + skeleton states.
- **Upgrade the shared course card** (Coursera/Udemy anatomy): cover/thumbnail, title, level chip, rating + rating count, duration/credits, price (VND), optional badge (Bán chạy / Mới). One reusable card shared by grid, shelves, and (where applicable) the slider.
- Add i18n keys (`courseSystem.categories.*`, `courseSystem.browse.*`) for vi + en; a11y for carousel + tablist; crawlable category pages (SEO).

This is a **frontend mock**. The BE category contract is an assumption — categories are owned by BE later and this hook is the swap point.

## Capabilities

### New Capabilities
- `course-catalog-browse`: browse-by-category catalog experience — category model + hook, category shelves, chip/tab bar, facet + sort bar, category landing page, upgraded shared course card, loading/empty states, i18n, a11y and SEO for course discovery.

### Modified Capabilities
<!-- No existing openspec/specs/ capability governs the catalog's requirements; introduced as new. -->

## Impact

- Routes: `/courses` (redesigned), new `/courses/category/[slug]`.
- Components: `CourseCatalog/`, `CourseCard` (shared, upgraded), new `CategoryShelf`, `CategoryChipBar`, `CategoryPage` and their skeletons; reuses `FeaturedSlider`'s `useCarousel`.
- Data: `Course` type + `useQueryCoursesSwr` mock gain `category` (and `rating` / `priceVnd` / `durationHours` fields for card anatomy); new `useQueryCourseCategoriesSwr` mock hook.
- i18n: `courseSystem.categories.*`, `courseSystem.browse.*` (vi + en).
- No new npm dependency. No BE change (mock only; BE category endpoint is the documented future swap).
