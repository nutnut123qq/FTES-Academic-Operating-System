## Context

FTES AOS was stripped from StarCi Academy and already carries the blog data layer (types +
`queryBlogPosts`/`queryBlogPost`), the `blog.*` i18n namespace (re-branded "FTES AOS"), the `blog()`
path builder, and the shared blocks the blog needs (`PageHeader`, `AsyncContent`, `MarkdownContent`,
`seo/jsonLd`). What is missing is the routes and UI. StarCi's blog UI lives under
`src/components/layouts/blog/**` and is the visual/behavioral reference. FTES is FE-only here with
**no blog backend**, so content must be mocked.

## Goals / Non-Goals

**Goals:**
- A working `/blog` listing and `/blog/[slug]` reader that visually/behaviorally match StarCi.
- Reuse existing FTES pieces; write no new backend and add no new dependency.
- Keep the data-fetch in the real query's async/SWR shape so adopting a backend is a one-line swap.
- Follow the FTES FE code canon (house skill `starci-fe-cannon-apply`): feature components under
  `layouts/blog/**`, block-owns-styling, `AsyncContent` for async gating, i18n by key.

**Non-Goals:**
- No blog backend, admin authoring, or persistence.
- No 3D WebGL `Masthead` and no "start here" pinned post (StarCi-specific) — deferred.
- No new premium/entitlement logic — the lock is driven by the mock's `isLocked`/`isPremium` flags only.

## Decisions

- **Mirror StarCi's component tree under `src/components/layouts/blog/**`.**
  `BlogList/` (index + `CategoryFilter`, `FeaturedPost`, `TopicsStrip`, `BlogListSkeleton`),
  `BlogPost/` (index + `ReadingProgress`, `RelatedPosts`, `BlogPostSkeleton`),
  `shared/` (`PostRow`, `category.ts`). Thin route files under `src/app/[locale]/blog/**` mount them.
  *Why:* least-surprise for anyone who knows StarCi; keeps future re-syncs cheap.

- **Mock content module `src/components/layouts/blog/mock.ts`** exporting typed
  `QueryBlogPostListItem[]` + a `Record<slug, QueryBlogPostDetail>`, plus two async helpers
  `fetchMockBlogPosts({category,limit,offset})` and `fetchMockBlogPost(slug)` that reproduce the
  filter/paginate/lock semantics. `BlogList`/`BlogPost`/`RelatedPosts` call these via `useSWR` with
  the same keys StarCi uses.
  *Why over faking the Apollo layer:* the real `queryBlogPosts`/`queryBlogPost` hit a resolver that
  doesn't exist and would error; a local module is honest, obviously-mock, and swappable. Alternative
  considered — overriding the query functions to return mock — rejected because it hides the mock
  inside the data layer and muddies the real query for when the BE lands.

- **Detail route stays a server component with `async params`** (`params: Promise<{locale,slug}>`)
  so `generateMetadata` + JSON-LD article schema work, matching StarCi and FTES's app-router shape.
  The body is the client `BlogPost` reading the slug.

- **Lean header instead of the 3D masthead.** `BlogList` opens straight with `PageHeader` +
  `TopicsStrip`. The WebGL masthead is skipped (heavy, untestable headless, StarCi-specific subject).

## Risks / Trade-offs

- [Mock drift from real contract] → The mock is typed against the existing `QueryBlogPostListItem`/
  `QueryBlogPostDetail`, so any contract change is a compile error at swap time; the swap path is
  documented in a `// ponytail:` comment on the fetchers.
- [Markdown body from a mock string] → Bodies are short hand-written markdown; `MarkdownContent`
  already renders arbitrary markdown, so no new risk.
- [Skipping masthead diverges from StarCi visually] → Acceptable and reversible; `ArchitectureScene`
  exists in FTES, so the masthead can be added later without rework.
- [Premium lock is cosmetic] → With no entitlement backend, `isLocked` is a mock flag; the lock card
  is presentation only. Documented as an assumption.

## Migration Plan

Additive only. When `blogPosts`/`blogPost` resolvers exist: replace the two `fetchMock*` calls with
`queryBlogPosts`/`queryBlogPost` (same args, same return shape) and delete `mock.ts`. No component or
route change. Rollback = revert the additive files; nothing else references them except the already-live
home "Read the blog" link, which simply dead-ends again.

## Open Questions

- Final count/topics of seed mock posts (pick ~5 realistic FTES-flavored posts) — decided at
  implementation, not blocking.
