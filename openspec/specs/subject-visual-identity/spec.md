# subject-visual-identity Specification

## Purpose
TBD - created by archiving change workplace-subject-images. Update Purpose after archive.
## Requirements
### Requirement: Subject type carries visual identity fields
The `Subject` type SHALL include `imageUrl: string | null` (required, nullable) and an
optional `accentColor` string. Mock data SHALL populate `imageUrl` with deterministic
local static asset paths keyed by subject code (`/subjects/<code-lowercase>.png`), with
at least one mock subject carrying `imageUrl: null` to exercise the fallback path. No
remote image hosts SHALL be introduced (no `next.config` `remotePatterns` change).

#### Scenario: Deterministic mock image paths
- **WHEN** the mock subject list resolves
- **THEN** each subject with an image references a file that exists under `public/subjects/`
- **AND** the same subject code always maps to the same image path across reloads

#### Scenario: Nullable by contract
- **WHEN** a subject is constructed (mock or future BE mapper)
- **THEN** `imageUrl` must be explicitly set to a string or `null` (the type does not allow omission)

### Requirement: Catalog card renders a subject thumbnail
Each subject card in the `/subjects` catalog SHALL render the subject image as a
full-bleed top thumbnail using `next/image` with a fixed 16:9 aspect-ratio box and
cover cropping, above the existing identity row. The card SHALL keep its existing
hover treatment (`hover:bg-default/40`) with no image zoom effects.

#### Scenario: Card with image
- **WHEN** a subject with a non-null `imageUrl` renders in the catalog grid
- **THEN** the card shows the image as a 16:9 cover-cropped thumbnail at the top of the card
- **AND** the identity row (initials badge, code, name) and chip row render unchanged below it

#### Scenario: Card without image
- **WHEN** a subject with `imageUrl: null` renders in the catalog grid
- **THEN** the card renders with today's image-less layout (no empty thumbnail box, no broken-image glyph)
- **AND** the code-initials badge in the identity row remains the subject's visual mark

#### Scenario: Responsive sizing without layout shift
- **WHEN** the catalog grid renders at mobile (1 column), `sm` (2 columns), and `lg` (3 columns)
- **THEN** the thumbnail box reserves its 16:9 space before the image loads (no layout shift)
- **AND** the `next/image` `sizes` attribute matches the column widths so an appropriately sized image is requested

### Requirement: Workspace header shows the subject image
The subject workspace shell header SHALL render the subject image in the existing
`size-11` identity badge slot (rounded, cover-cropped) when `imageUrl` is non-null,
falling back to the code-initials badge otherwise. The slot footprint SHALL be
identical in both states so the header layout does not change.

#### Scenario: Header with image
- **WHEN** the workspace shell renders for a subject with a non-null `imageUrl`
- **THEN** the header identity slot shows the image cover-cropped in the same `size-11` rounded box
- **AND** the title, meta line, and lecturer chip render unchanged

#### Scenario: Header fallback
- **WHEN** the subject has `imageUrl: null` or the subject is still loading
- **THEN** the header shows the current code-initials badge in the same slot

### Requirement: Broken images fall back to the initials badge
A failed image load SHALL swap the image for the code-initials badge treatment of that
slot, anywhere a subject image renders (catalog card, workspace header). A browser
broken-image glyph SHALL never be shown.

#### Scenario: Broken image in the catalog card
- **WHEN** a card's image fails to load (404 or decode error)
- **THEN** the card re-renders in its image-less layout with the initials badge as the visual mark

#### Scenario: Broken image in the workspace header
- **WHEN** the header image fails to load
- **THEN** the header identity slot shows the code-initials badge

### Requirement: Catalog loading skeleton mirrors the card
While the subject list is loading (or errored with no data), the catalog SHALL render
skeleton cards that mirror the real card layout — a 16:9 thumbnail box, two text lines,
and a chip-row line — using the house `Skeleton` primitive. Static chrome (page title,
search input, difficulty filter) SHALL remain outside the skeleton.

#### Scenario: Skeleton while loading
- **WHEN** the subjects query is in `isLoading` state
- **THEN** the grid area shows skeleton cards with the same boxes and proportions as real cards
- **AND** the title, search field, and filter buttons render normally (not skeletonized)

### Requirement: Accessibility and i18n
Subject images SHALL use the subject name as their `alt` text. Fallback initials badges
remain decorative (text content is the code initials, adjacent text carries the name).
Existing `subjects.*` i18n keys SHALL remain untouched; any new user-visible string
SHALL be added to both `vi` and `en` message files.

#### Scenario: Alt text equals subject name
- **WHEN** a subject image renders in the card or header
- **THEN** its `alt` attribute equals the subject's `name`

#### Scenario: i18n verified untouched
- **WHEN** the change is complete
- **THEN** existing `subjects.*` keys in `vi` and `en` are unchanged
- **AND** the messages JSON files remain valid and key-parallel between locales

