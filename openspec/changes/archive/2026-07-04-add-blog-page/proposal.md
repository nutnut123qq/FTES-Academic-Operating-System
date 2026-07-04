## Why

The home landing "Đội ngũ FTES" founder byline now has a "Read the blog" link (mirrored
from StarCi), but `/blog` does not exist — the link dead-ends. StarCi ships a full editorial
blog; FTES already carries the blog GraphQL types, `queryBlogPosts`/`queryBlogPost`, the
`blog.*` i18n namespace (branded "FTES AOS"), and the `blog()` path builder, but has no routes
or UI. This change ports the blog UI so the home CTA lands somewhere real.

## What Changes

- Add route `/[locale]/blog` rendering a `BlogList`: reframed `PageHeader` + topics strip +
  category-pillar filter + a featured lead post + a text-first `PostRow` list + "load more".
- Add route `/[locale]/blog/[slug]` rendering a `BlogPost` detail: back link, header chips
  (pillar + premium), optional cover, `MarkdownContent` body, sticky reading-progress bar,
  premium-lock card, end-of-article CTA (source + funnel), and a "More in {category}" related strip.
- Add blog UI components under `src/components/layouts/blog/**`, mirroring StarCi's structure.
- Add a **static mock content module** (`src/components/layouts/blog/mock.ts`) with a handful of
  typed posts + details. The list/detail data-fetch reads from the mock (kept in SWR shape so the
  swap to the real `queryBlogPosts`/`queryBlogPost` is a one-line change when a backend exists).
- **SKIP** (deliberate, lean port): StarCi's 3D WebGL `Masthead` and the "start here" pinned post
  (both StarCi-specific) — noted as deferred, not lost.

## Capabilities

### New Capabilities
- `blog`: Public editorial blog — a `/blog` listing (pillar filter, featured post, paginated
  rows) and a `/blog/[slug]` article reader (markdown body, reading progress, related posts,
  premium gate). FE-only against a mock content source with a defined swap path to a real backend.

### Modified Capabilities
<!-- None — home-landing already links to blog(); no requirement change there. -->

## Impact

- **New routes:** `src/app/[locale]/blog/page.tsx`, `src/app/[locale]/blog/[slug]/page.tsx`.
- **New components:** `src/components/layouts/blog/**` (BlogList + children, BlogPost + children,
  shared PostRow + category config, skeletons, mock module).
- **Reused, unchanged:** blog GraphQL types + `queryBlogPosts`/`queryBlogPost`
  (`src/modules/api/graphql/queries`), `blog.*` i18n (`src/messages/{vi,en}.json`), `blog()` path
  builder, `PageHeader` + `AsyncContent` blocks, `MarkdownContent`, `seo/jsonLd`.
- **Assumption:** No blog backend in FTES; content is mock. When the `blogPosts`/`blogPost`
  resolvers exist, replace the mock fetchers with the existing query functions — data contracts
  already match, so no UI change is needed.
- **No breaking changes.** New surface only; existing links already point at `blog()`.
