# content-save-toggle Specification

## ADDED Requirements

### Requirement: Save toggle on resource and course surfaces
The system SHALL render a shared save-toggle button (icon-only bookmark) on each resource row in the Resource Hub, in the Resource Detail header, on each course card in the Course Catalog, and in the Course Detail header. The icon MUST be outline when the item is not saved and filled (accent) when it is saved, and the button MUST expose `aria-pressed` reflecting the saved state plus an i18n accessible name ("Lưu" / "Bỏ lưu", en "Save" / "Unsave").

#### Scenario: Save a resource from the Resource Hub list
- **GIVEN** an authenticated user on `/resources` viewing an unsaved resource row
- **WHEN** the user presses the bookmark button on that row
- **THEN** the icon fills immediately (optimistic, no spinner) and the resource is added to the user's saved items

#### Scenario: Unsave a resource from Resource Detail
- **GIVEN** an authenticated user on a resource detail page whose resource is already saved (filled icon)
- **WHEN** the user presses the bookmark button
- **THEN** the icon returns to outline immediately and the resource is removed from saved items

#### Scenario: Save a course from the Course Catalog
- **GIVEN** an authenticated user on the course catalog viewing an unsaved course card
- **WHEN** the user presses the bookmark button on the card
- **THEN** the icon fills immediately and the course is added to saved items, and pressing the card body still navigates to the course (the toggle MUST NOT trigger card navigation)

#### Scenario: Unsave a course from Course Detail
- **GIVEN** an authenticated user on a course detail page whose course is saved
- **WHEN** the user presses the bookmark button in the header
- **THEN** the icon returns to outline and the course is removed from saved items

### Requirement: Guest save attempt is auth-gated
The system SHALL NOT toggle saved state for unauthenticated users. A guest pressing any save button MUST be shown the existing sign-in prompt (auth login popup overlay) and the item's saved state MUST remain unchanged.

#### Scenario: Guest presses save on a resource card
- **GIVEN** an unauthenticated visitor on `/resources`
- **WHEN** the visitor presses a bookmark button
- **THEN** the login popup opens, the icon stays outline, and nothing is persisted

### Requirement: Saved state is consistent and persistent (mock)
Saved state SHALL be a single client-side source of truth shared by all surfaces: toggling on one surface MUST be reflected on every other surface showing the same entity without a reload. Saved state MUST survive a page reload in the same browser (mock persistence via `localStorage`). The FE contract is `{ entityType: "resource" | "course", entityId, isFavorite }`; the existing course-scoped `toggleFavourite` GraphQL mutation MUST NOT be called (BE generalization is an explicit assumption recorded in design.md).

#### Scenario: Toggle reflects across surfaces
- **GIVEN** a user saves a course from the catalog card
- **WHEN** the user navigates to that course's detail page
- **THEN** the header bookmark button renders filled

#### Scenario: Saved state survives reload
- **GIVEN** a user has saved a resource
- **WHEN** the user reloads the browser tab
- **THEN** after hydration the resource's bookmark button renders filled

#### Scenario: Pre-hydration render never flashes wrong state
- **GIVEN** a page with save buttons is server-rendered
- **WHEN** the client has not yet hydrated the mock store from `localStorage`
- **THEN** buttons render a neutral/unsaved appearance and update once hydration completes, without toggling any stored data

### Requirement: Save toggle i18n
All save-toggle strings (accessible names, any tooltip/toast copy) SHALL exist in both `vi.json` and `en.json`, with Vietnamese as the primary copy ("Lưu", "Bỏ lưu", "Đã lưu").

#### Scenario: Locale switch
- **GIVEN** a saved resource row rendered in the `vi` locale with accessible name "Bỏ lưu"
- **WHEN** the user switches to the `en` locale
- **THEN** the button's accessible name renders "Unsave" with identical behavior
