## ADDED Requirements

### Requirement: Blog list rows show the post cover thumbnail

Each blog list row SHALL show the post's cover image as a 16:9 thumbnail when the post has one, alongside
the title/meta, falling back to text-only when there is no cover.

#### Scenario: Post has a cover

- **WHEN** a listed post has a thumbnailUrl
- **THEN** the row shows a 16:9 cover thumbnail next to the title

#### Scenario: Post has no cover

- **WHEN** a listed post has no thumbnailUrl
- **THEN** the row renders text-only (no broken image)
