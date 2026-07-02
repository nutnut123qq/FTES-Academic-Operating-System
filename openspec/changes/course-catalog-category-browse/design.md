## Research: Coursera / Udemy patterns

Studied how Coursera and Udemy present course discovery to ground this redesign.

**Coursera** ([/browse](https://www.coursera.org/browse), [topic catalog](https://www.coursera.support/s/topiccatalog)):
- Top-level **"Explore Categories"** grid of ~11 subjects (Computer Science, Data Science, Business, Math & Logic, Language Learning …) as clickable text links → each drills into a **category landing page**.
- A **"Most popular" rail** with a small filter tab row (All / Business / Data Science / IT / CS) rendered as a **horizontal course carousel**.
- **Course card anatomy**: thumbnail, status **badge** ("Bestseller", "Free Trial", "Job Skills"), provider logo + name, title (clickable), **star rating + review count** (e.g. "4.8 · 181K reviews"), metadata line (level · content type · duration).
- Rails end with **"Show N more" / "View all"** links; footer has skill shortcut chips (Python, SQL, AI).

**Udemy** ([topic/python](https://www.udemy.com/topic/python/), [badges guide](https://support.udemy.com/hc/en-us/articles/229605188-Instructors-Udemy-Badges-Guide-Explanation)):
- **Category/topic landing page**: big header (title + one-line description + metrics: learners, course count, avg rating), then **sub-topic chips**, then stacked **horizontal shelves** ("Featured", "Most popular", "Highest rated") — each a swipeable carousel.
- **Course card**: 240×135 cover, title, instructor, **rating "4.6 out of 5" + review count**, total hours + lecture count, level ("All Levels"), price, and **"Bestseller" / "Highest Rated" badges** (a course can hold up to 2 badges).
- Sort/facet controls (relevance, level, duration, price) on the results view.

**Patterns adopted here**: category shelves (one carousel per category) below a featured hero, a category chip bar for quick jump, section headers with a "see all" link into a category landing page, a facet + sort bar over search, and a Coursera/Udemy-anatomy course card (cover · title · level · rating+count · duration/credits · price · optional badge). Trimmed to what FTES mock data supports (no instructor/provider concept yet; providers omitted).

Sources:
- https://www.coursera.org/browse
- https://www.coursera.support/s/topiccatalog
- https://www.udemy.com/topic/python/
- https://support.udemy.com/hc/en-us/articles/229605188-Instructors-Udemy-Badges-Guide-Explanation

## Context

`/courses` renders `src/components/features/course/CourseCatalog/index.tsx`: a text search, a level-filter button row, and a flat responsive grid (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`) of hand-rolled card links. A featured hero slider (`CourseCatalog/FeaturedSlider/`, driven by `useQueryFeaturedCoursesSwr` and the scroll-snap `useCarousel` hook) sits above it. Catalog course data comes from the lightweight mock `useQueryCoursesSwr` (`Course` = `{ id, code, name, level, credits, lessons }`). A richer shared `CourseCard` block (`components/blocks/cards/CourseCard`) exists but is bound to the GraphQL `CourseEntity`; the catalog does not use it.

Constraints: FE-only, HeroUI + Tailwind, next-intl (vi/en), webpack build, house canon (semantic spacing scale, HeroUI primitives, block-owns-padding). No BE course/category endpoint yet — everything is a deterministic mock, SWR-shaped for a drop-in swap.

## Goals / Non-Goals

**Goals:**
- Model course **category** on the mock and expose a BE-ready `useQueryCourseCategoriesSwr` hook (the documented swap seam).
- Redesign `/courses` into a browse-by-category experience: featured hero → category chip bar → per-category shelves (carousels) with "Xem tất cả" → facet + sort bar → search.
- Add a `/courses/category/[slug]` landing page (header, facets, grid, empty/skeleton).
- Provide ONE upgraded shared course card (Coursera/Udemy anatomy) used by shelves, grid, and category page.
- Reuse the existing `useCarousel` scroll-snap primitive (no new dependency). i18n vi/en, a11y, crawlable category pages.

**Non-Goals:**
- No BE work; no real category endpoint (mock only). BE will own categories later.
- No multi-category-per-course, no nested sub-categories, no tag/skill taxonomy beyond the 3 seed categories.
- No instructor/provider entity (mock has none); no reviews list, no personalised recommendations.
- No change to the course detail page (already Coursera-like) or to the GraphQL `CourseEntity`-bound `CourseCard` used elsewhere.

## Decisions

### D1 — Category as a frontend-defined, BE-ready list (swap seam)
Add `useQueryCourseCategoriesSwr` returning `Array<CourseCategory>` where `CourseCategory = { id, slug, name: { vi, en }, icon, accent }`, from a deterministic mock. Add `category: string` (a category **slug**) to the `Course` type and to every mock course. The hook is the single **swap point**: replacing the mock fetcher with a BE category endpoint is a drop-in.
- *Why*: mirrors the existing `useQueryFeaturedCoursesSwr` mock pattern (per-locale `name`, SWR-keyed) so the swap is uniform. Slug (not id) is the join key so it doubles as the route param and stays stable across a BE swap.
- *Assumption (documented)*: BE will own the category taxonomy; the FE list is a placeholder. Categories seed: `math` (Toán), `programming` (Lập trình), `foreign-languages` (Ngoại ngữ). Every course maps to exactly one category.
- *Alternative rejected*: inline category strings on courses with no hook — no swap seam, no localized names/icons.

### D2 — Category shelves reuse `useCarousel` (no new dependency)
Each category renders as a `CategoryShelf`: a section header (icon + localized name + "Xem tất cả" link → `/courses/category/[slug]`) over a horizontal scroll-snap track built with the **existing** `useCarousel` hook and the same `snap-x` track markup as `FeaturedSlider`. Cards are `snap-start` items sized to show ~1.2 (mobile) → ~4 (desktop) at a time. Prev/next controls reuse the slider's affordance; native swipe on touch.
- *Why*: the change brief and the carousel hook's own doc comment forbid a new carousel dependency; the primitive already handles reduced-motion, focus-within pause, and index sync.
- *Adjustment*: shelves do **not** autoplay (only the hero does) — pass a flag / omit the autoplay wiring so shelves are pure manual scroll. `useCarousel` already disables autoplay under `<2` items and reduced motion; shelves additionally never auto-advance.
- *Alternative rejected*: a generic third-party carousel — new dep, redundant with the in-repo primitive.

### D3 — One shared, upgraded CourseCard (Coursera/Udemy anatomy)
Introduce a single reusable catalog card consumed by shelves, the main grid, and the category page. Anatomy (fields, each gracefully optional): cover/thumbnail (16:9, branded gradient fallback like the existing block), title, **level chip**, **rating + rating count**, **duration** (hours) or **credits**, **price (VND)** via the house `PriceTag`, and an optional **badge** (Bán chạy = bestseller / Mới = new). The card links to the course detail route; the save toggle stays and must not trigger navigation.
- *Why*: "shared reusable card so grid + shelves + slider share it" (brief). Consistency across surfaces; one place to evolve anatomy.
- *Data*: the mock `Course` gains `rating?`, `ratingCount?`, `durationHours?`, `priceVnd?`, `badge?` so the card can render Coursera/Udemy anatomy from mock data. Missing fields hide their row (no rating → no stars; no badge → no ribbon).
- *Note*: the existing `blocks/cards/CourseCard` is `CourseEntity`-bound and used elsewhere — this catalog card is a distinct, mock-`Course`-bound card (or an adapter), so upgrading it does not disturb `CourseEntity` consumers. Where a course already carries the needed fields, upgrade in place; otherwise add an adapter.

### D4 — Facet + sort bar over search (elevated, not replaced)
Keep text search + level filter but present them as a **facet bar**: search input, level segmented filter, and a **sort** control with options `popular` (phổ biến, default), `newest` (mới), `rating` (đánh giá). Search matches across all categories (code + name). On `/courses` the facet bar filters within the shelf/browse view; on the category page it filters that category's grid.
- *Why*: matches Coursera/Udemy facet+sort while preserving existing behaviour.

### D5 — Category landing page at `/courses/category/[slug]`
New route renders `CategoryPage`: header (localized name, description, course count), the facet + sort bar, and a full responsive grid of that category's courses (shared card), with a skeleton mirroring the grid and an empty state when no course matches. Unknown slug → not-found. Page is server-crawlable (static-friendly; category slugs are a known finite set for SEO).
- *Why*: Coursera/Udemy "category → landing page" drill-in; gives search engines and deep links a real page per subject.

### D6 — Empty categories hidden; skeletons mirror layout
A category with zero courses is **not** rendered as a shelf on `/courses` (no empty shelves). Loading states use HeroUI `Skeleton` mirroring the real layout: shelf skeletons on `/courses` (header bar + a row of card skeletons), grid skeleton on the category page — per the house skeleton canon (gate on `isLoading || !data`, keep static chrome out of the skeleton).

## Component decomposition

- `useQueryCourseCategoriesSwr` (hook, mock) → `CourseCategory[]` with localized `name`, `icon`, `accent`; the BE swap seam.
- `useQueryCoursesSwr` (existing, extended) → `Course` gains `category` (slug) + card-anatomy fields; helper selectors `coursesByCategory(slug)`.
- `CourseCard` (shared catalog card) → cover, title, level chip, rating+count, duration/credits, price, optional badge, save toggle; used by shelf, grid, category page.
- `CourseCardSkeleton` → mirrors the card box for shelf/grid loading.
- `CategoryChipBar` → horizontal, scrollable chip/tab row (All + one per category) for quick jump/filter; ARIA `tablist`/`tab`. On `/courses` it scroll-jumps to / filters the matching shelf.
- `CategoryShelf` → section header (icon + name + "Xem tất cả" link) + `useCarousel` scroll-snap track of `CourseCard`s; hidden when the category has no course.
- `CategoryShelfSkeleton` → header bar + a row of `CourseCardSkeleton`.
- `CourseCatalog` (redesigned) → composes `FeaturedSlider` (unchanged, top) → `CategoryChipBar` → facet+sort bar → `CategoryShelf` per category (or a filtered grid when a facet/search is active).
- `CategoryPage` (new, `/courses/category/[slug]`) → header + facet+sort bar + grid of `CourseCard` + `CategoryGridSkeleton` + empty state.

Composition with FeaturedSlider: the hero slider stays exactly as-is at the top of `CourseCatalog`; shelves render below it. Both use `useCarousel`, but the hero keeps autoplay while shelves are manual-only (D2).

## Risks / Trade-offs

- [Mock category taxonomy diverges from BE] → keep everything behind `useQueryCourseCategoriesSwr` and key the join on `slug`; document the swap point in the hook and design so the BE endpoint is drop-in.
- [Two "CourseCard"s (mock-bound catalog card vs `CourseEntity`-bound block) cause confusion] → name/locate the catalog card distinctly and note in code which entity each binds to; do not touch `CourseEntity` consumers.
- [Reusing `useCarousel` for many shelves = many autoplay timers] → shelves never autoplay (D2); only the single hero autoplays.
- [Empty/edge states] → empty categories hidden on `/courses`; category page shows an explicit empty state; unknown slug → not-found.
- [Horizontal shelf a11y] → carousel region labelled, prev/next are real buttons with `aria-label`; chip bar is a `tablist` with `aria-selected`.

## Migration Plan

Additive, FE-only. Extend the mock `Course` type + data (new fields optional/back-compatible), add the categories hook, redesign the catalog, add the category route. No data migration, no BE change. Rollback = revert the change (the featured slider and course detail are untouched). BE swap later: replace the mock fetcher in `useQueryCourseCategoriesSwr` (and category field source) with the real endpoint.

## Open Questions

- Final icon + accent per category (placeholder icons/accents chosen now; confirm with design).
- Badge rule (Bán chạy / Mới): mock flags now; BE will define real bestseller/new criteria later.
- Whether the category chip bar should hard-filter the browse view or only scroll-jump to a shelf (spec supports jump; filter is the facet bar's job) — confirm with product.
