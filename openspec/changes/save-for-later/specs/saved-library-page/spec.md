# saved-library-page Specification

## ADDED Requirements

### Requirement: Saved page at /saved
The system SHALL provide a localized page at `/saved` ("Đã lưu") listing the viewer's saved resources and courses, newest-saved first. Each row MUST show the item's title, a type indicator, and secondary context (resource: subject/type; course: course subtitle/cover context), and MUST link to the item's detail page. The route SHALL be added to `pathConfig` as `locale().saved()`.

#### Scenario: Authenticated user views saved items
- **GIVEN** an authenticated user who has saved 2 resources and 1 course
- **WHEN** the user opens `/saved`
- **THEN** 3 rows render (newest first), each linking to its resource or course detail page

#### Scenario: Guest opens /saved
- **GIVEN** an unauthenticated visitor
- **WHEN** they open `/saved`
- **THEN** the page renders an inline sign-in prompt state (no saved data, no redirect loop) with an action that opens the login popup

### Requirement: Type tabs filter the saved list
The page SHALL provide tabs "Tất cả" / "Tài liệu" / "Khoá học" (All / Resources / Courses) filtering the list by entity type. Tabs with both icon and label MUST hide the label below the `sm` breakpoint while keeping an accessible name.

#### Scenario: Filter to courses only
- **GIVEN** a user on `/saved` with saved resources and courses under "Tất cả"
- **WHEN** the user selects the "Khoá học" tab
- **THEN** only saved courses are listed and the resources disappear from the list

### Requirement: Search within saved items
The page SHALL provide a title search input that filters the currently active tab's items case-insensitively; clearing the input restores the full tab list.

#### Scenario: Search narrows results
- **GIVEN** a user with saved items titled "Nginx cơ bản" and "Kafka nâng cao"
- **WHEN** the user types "nginx" in the search field
- **THEN** only "Nginx cơ bản" remains listed

#### Scenario: Search with no matches
- **GIVEN** a user on `/saved` with at least one saved item
- **WHEN** the search term matches nothing in the active tab
- **THEN** a "no results" empty state renders (distinct from the never-saved empty state)

### Requirement: Unsave in place from the saved list
Each row SHALL carry the shared save-toggle button in the saved (filled) state. Unsaving MUST remove the row from the list immediately (optimistic) and update all other surfaces.

#### Scenario: Unsave removes the row
- **GIVEN** a user on `/saved` with a saved course row
- **WHEN** the user presses the row's bookmark button
- **THEN** the row disappears immediately and the course's catalog/detail buttons render unsaved afterwards

### Requirement: Empty and loading states
When the user has no saved items in the active tab, the page SHALL render an empty state with copy explaining the feature and a CTA linking to `/resources` (resources tab) or `/courses` (courses tab / all). While the saved store hydrates, the page SHALL render a skeleton mirroring the real row-list layout (HeroUI Skeleton; static chrome such as the page heading stays outside the skeleton).

#### Scenario: Never-saved empty state
- **GIVEN** an authenticated user with zero saved items
- **WHEN** they open `/saved`
- **THEN** an empty state renders with a CTA to browse resources/courses instead of an empty list

#### Scenario: Loading skeleton before hydration
- **GIVEN** a user opens `/saved` before the client store hydrates
- **WHEN** the list data is not yet available
- **THEN** a row-shaped skeleton renders in place of the list only, then swaps to real rows without layout shift

### Requirement: Entry point from the account menu
The existing account-menu "Đã lưu" item (currently targeting the dead `/profile/settings/bookmarks` link) SHALL navigate to `/saved`. The item remains visible only to authenticated users.

#### Scenario: Navigate from avatar menu
- **GIVEN** an authenticated user who opens the navbar avatar dropdown
- **WHEN** they press the "Đã lưu" item
- **THEN** the dropdown closes and the app navigates to the localized `/saved` page (no 404)

### Requirement: Saved page i18n and a11y
All page strings (title, tab labels, search placeholder, empty states, CTA) SHALL exist in `vi.json` and `en.json` (reusing existing `bookmarks.*` keys where the copy matches). The page MUST have a proper heading hierarchy and the search input an associated accessible label.

#### Scenario: English locale rendering
- **GIVEN** a user on `/en/saved`
- **WHEN** the page renders
- **THEN** the title, tabs, search placeholder, and empty states all render in English with no missing-key output
