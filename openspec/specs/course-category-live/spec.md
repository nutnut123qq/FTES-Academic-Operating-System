# course-category-live Specification

## Purpose
TBD - created by archiving change content-live-wire. Update Purpose after archive.
## Requirements
### Requirement: Category taxonomy comes from the backend
The frontend SHALL build the course category chips and shelves from
`GET /courses/categories`, replacing the mock single-category seed, keeping `slug` as the
stable route/identifier and displaying `name`, `description`, and optionally `courseCount`.

#### Scenario: Chips reflect real categories
- **WHEN** the category endpoint returns the migrated categories
- **THEN** the chip bar shows an "All" chip plus one chip per real category, keyed by `slug`

### Requirement: Category filtering is server-driven
The frontend SHALL filter courses by resolving the selected category `slug` to its `id` and
calling `GET /courses?categoryId={id}`, rather than filtering the full list client-side.

#### Scenario: Selecting a category fetches its courses
- **WHEN** a user selects a category chip
- **THEN** the catalog requests courses with the matching `categoryId`
- **AND** only courses in that category are shown

#### Scenario: Category page for a real slug
- **WHEN** a user opens `/courses/category/{slug}` for an existing category
- **THEN** the page renders that category's courses with SEO metadata
- **AND** an unknown slug renders the not-found state

