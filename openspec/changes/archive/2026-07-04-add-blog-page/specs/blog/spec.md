## ADDED Requirements

### Requirement: Blog listing page
The system SHALL serve a public `/[locale]/blog` page that lists published blog posts newest-first,
reframed with a `PageHeader` (localized `blog.title`/`blog.subtitle`), a static topics strip, an
optional editorial-pillar filter, a featured lead post, and a paginated list of post rows.

#### Scenario: Posts render newest-first
- **WHEN** a visitor opens `/blog` and posts are available
- **THEN** the first post renders as a featured lead and the remaining posts render as text-first rows, each showing title, excerpt, pillar chip, localized date, and reading time

#### Scenario: Pillar filter appears only when useful
- **WHEN** the loaded posts span two or more editorial pillars
- **THEN** a category filter row is shown; when only one pillar is present the filter is hidden (no dead buckets)

#### Scenario: Filtering by pillar
- **WHEN** the visitor selects a pillar in the filter
- **THEN** the list shows only posts of that pillar and pagination resets to the first page

#### Scenario: Load more
- **WHEN** more posts exist than are currently shown
- **THEN** a "load more" control is shown and appends the next page while keeping existing posts visible

#### Scenario: Empty and error states
- **WHEN** no posts match (globally or within a filter), or loading fails
- **THEN** the page shows the corresponding localized empty/error content, and the error state offers a retry

### Requirement: Blog article page
The system SHALL serve a public `/[locale]/blog/[slug]` page that renders a single article: a back
link to the blog, header chips (pillar and, when applicable, premium), an optional cover image, the
markdown body rendered via `MarkdownContent`, a sticky reading-progress indicator, an end-of-article
CTA, and a "More in {category}" related-posts strip.

#### Scenario: Article renders by slug
- **WHEN** a visitor opens `/blog/<slug>` for an existing post
- **THEN** the article header, cover (if present), and markdown body render, and a reading-progress bar reflects scroll position

#### Scenario: Premium article is gated
- **WHEN** the requested article is premium and the reader is not entitled (`isLocked`)
- **THEN** the body is truncated and a members-only lock card is shown in place of the remainder

#### Scenario: Related posts strip
- **WHEN** other posts exist in the same pillar as the current article
- **THEN** a "More in {category}" strip lists up to three of them, excluding the current article; otherwise the strip is hidden

#### Scenario: Unknown slug
- **WHEN** the slug does not resolve to a post
- **THEN** the page shows the localized "article not found" content and a way back to the blog

### Requirement: Blog content source is swappable
The system SHALL source blog content in FTES from a static mock module while no blog backend exists,
keeping the data-fetch in the same async/SWR shape as the real `queryBlogPosts`/`queryBlogPost` so
the backend can be adopted without UI changes.

#### Scenario: Mock powers the UI today
- **WHEN** the blog pages load in FTES with no backend
- **THEN** list and detail render from the mock content module, respecting pillar filter and pagination arguments

#### Scenario: Backend swap is UI-neutral
- **WHEN** a blog backend later provides `blogPosts`/`blogPost` resolvers
- **THEN** replacing the mock fetchers with the existing query functions requires no change to the blog components, because the data contracts match

### Requirement: Home "Read the blog" link resolves
The home landing founder byline "Read the blog" link SHALL navigate to the working `/[locale]/blog`
page.

#### Scenario: Following the home CTA
- **WHEN** a visitor clicks "Read the blog" on the home page
- **THEN** the localized `/blog` listing page loads
