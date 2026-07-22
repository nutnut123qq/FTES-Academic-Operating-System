# blog-live

## ADDED Requirements

### Requirement: Blog list reads real posts
The frontend SHALL render `/blog` from `GET /api/v1/blog/posts`, supporting category
filtering via `categorySlug`, keyword search via `/blog/posts/search`, and pagination using
the backend `hasNext`, and SHALL remove the mock post source.

#### Scenario: List shows published posts
- **WHEN** a visitor opens `/blog`
- **THEN** posts from the backend are shown with title, thumbnail, and category
- **AND** no mock post appears

#### Scenario: Filter by category
- **WHEN** a visitor selects a blog category chip
- **THEN** the list requests posts for that `categorySlug`

#### Scenario: Search
- **WHEN** a visitor submits a search query
- **THEN** the list requests `/blog/posts/search?q=` and shows matches

### Requirement: Blog detail renders sanitized content
The frontend SHALL render `/blog/[slug]` from `GET /api/v1/blog/posts/{slug}`, rendering the
post markdown/HTML content through a sanitizing renderer, and SHALL emit SEO metadata from
the post.

#### Scenario: Detail page for existing slug
- **WHEN** a visitor opens `/blog/{slug}` for a published post
- **THEN** the post content renders safely (sanitized) with title and metadata

#### Scenario: Unknown slug
- **WHEN** a visitor opens `/blog/{slug}` that does not exist
- **THEN** the not-found state is shown
