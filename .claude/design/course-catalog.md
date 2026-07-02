# design — course-catalog (browse-by-category `/courses`)

Page: `/courses` → `features/course/CourseCatalog` + `/courses/category/[slug]` →
`features/course/CategoryPage`. OpenSpec change `course-catalog-category-browse`.

## Decision (2026-07-02) — direction A: shelves + chip-as-FILTER (Coursera/Udemy)

Section order: **FeaturedSlider (unchanged, autoplay) → title → CategoryChipBar →
FacetSortBar → one `CategoryShelf` per non-empty category**. Chosen over B
(chip = scroll-jump anchors + sticky facet cluster).

**Why A:** chip-as-filter keeps the facet bar visually adjacent to its results, needs
no sticky-offset/scroll-margin plumbing, and behaves predictably on mobile (no
scroll-jank when shelf heights change). Spec allowed "jump/filter" — filter chosen.

- **Chips filter the SHELF view only.** A live search or level facet switches to a flat
  sorted grid over ALL categories (spec: search is never category-scoped), so the grid
  ignores the chip. Empty categories render no shelf and no placeholder.
- **Shelves reuse `useCarousel`** (FeaturedSlider's scroll-snap primitive) with
  `{ autoplay: false }` — only the hero autoplays. Active index derives from the child
  offset nearest `scrollLeft`, so card-width tracks work; `next()` wraps to 0 only once
  the track is fully scrolled. Arrows live in the shelf header and hide when the track
  has no overflow (ResizeObserver).
- **Category landing** (`/courses/category/[slug]`): server `page.tsx` owns
  `generateStaticParams` + `generateMetadata` + `notFound()` for unknown slugs; the
  client feature renders header from the STATIC category seed (name/description in
  `browse/categories.ts`) so the initial HTML stays crawlable, then facets + grid.
- **Category taxonomy is data, not i18n:** `CourseCategory.name/description` carry
  `{vi,en}` in the seed (BE will own the taxonomy — the swap replaces the list); i18n
  namespaces `courseSystem.categories.*`/`courseSystem.browse.*` hold only UI labels.

**Skeletons:** shelf-shaped on `/courses` (header bar + clipped card row ×3), grid-shaped
on the category page; title + FacetSortBar are static chrome, kept out of the skeleton.
Chip bar is data-backed → hidden until categories resolve.

## Backend business
FE-only repo, no BE. Categories + courses mocked (`useQueryCourseCategoriesSwr`,
`useQueryCoursesSwr` — SWR-shaped swap seams; slugs are the stable contract). Sort
`popular`/`newest` are mock proxies (ratingCount / "new" badge) until BE signals land.
