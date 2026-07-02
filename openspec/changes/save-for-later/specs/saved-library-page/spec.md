# saved-library-page Specification

## ADDED Requirements

### Requirement: Saved page at /saved
The system SHALL provide a localized page at `/saved` ("Đã lưu") listing the viewer's saved resources, courses, and posts, newest-saved first. Each row MUST show the item's title (posts: content snippet), a type indicator, and secondary context (resource: subject/type; course: course subtitle/cover context; post: author + source context), and MUST link to the item's detail page. The route SHALL be added to `pathConfig` as `locale().saved()`.

#### Scenario: Authenticated user views saved items
- **GIVEN** an authenticated user who has saved 2 resources, 1 course, and 1 post
- **WHEN** the user opens `/saved`
- **THEN** 4 rows render (newest first), each linking to its resource, course, or post detail page

#### Scenario: Guest opens /saved
- **GIVEN** an unauthenticated visitor
- **WHEN** they open `/saved`
- **THEN** the page renders an inline sign-in prompt state (no saved data, no redirect loop) with an action that opens the login popup

### Requirement: Type tabs filter the saved list
The page SHALL provide tabs "Tất cả" / "Tài liệu" / "Khoá học" / "Bài viết" (All / Resources / Courses / Posts) filtering the list by entity type. Tabs with both icon and label MUST hide the label below the `sm` breakpoint while keeping an accessible name.

#### Scenario: Filter to courses only
- **GIVEN** a user on `/saved` with saved resources, courses, and posts under "Tất cả"
- **WHEN** the user selects the "Khoá học" tab
- **THEN** only saved courses are listed and the resources and posts disappear from the list

#### Scenario: Filter to posts only
- **GIVEN** a user on `/saved` with saved items of all three types under "Tất cả"
- **WHEN** the user selects the "Bài viết" tab
- **THEN** only saved posts are listed

### Requirement: Posts tab rows
Each row in the "Bài viết" tab (and post rows under "Tất cả") SHALL show the post author (avatar + name), a clamped content snippet, and a source-context line identifying where the post lives — community ("Cộng đồng"), the group's name, or the subject workspace's name — rendered from the source metadata captured at save time. The row MUST link to the post's detail page.

#### Scenario: Saved posts list with mixed sources
- **GIVEN** a user who saved one community post, one group post, and one subject workspace "Thảo luận" post
- **WHEN** the user opens the "Bài viết" tab
- **THEN** three rows render, each showing author, snippet, and its own source context (community / group name / subject name)

#### Scenario: Navigate to a saved post
- **GIVEN** a user on the "Bài viết" tab with a saved group post row
- **WHEN** the user presses the row (outside its bookmark button)
- **THEN** the app navigates to that post's detail page

#### Scenario: Unsave a post from the list
- **GIVEN** a user on the "Bài viết" tab with a saved post row (filled 🔖)
- **WHEN** the user presses the row's bookmark button
- **THEN** the row disappears immediately and the post's action-bar 🔖 renders outline on its feed surfaces afterwards

#### Scenario: Posts tab empty state
- **GIVEN** an authenticated user with saved resources but zero saved posts
- **WHEN** the user selects the "Bài viết" tab
- **THEN** an empty state renders explaining post saving with a CTA linking to the community feed

### Requirement: Search within saved items
The page SHALL provide a title search input that filters the currently active tab's items case-insensitively (for post rows, matching against author name and snippet text); clearing the input restores the full tab list.

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
When the user has no saved items in the active tab, the page SHALL render an empty state with copy explaining the feature and a CTA linking to `/resources` (resources tab), `/courses` (courses tab / all), or the community feed (posts tab). While the saved store hydrates, the page SHALL render a skeleton mirroring the real row-list layout (HeroUI Skeleton; static chrome such as the page heading stays outside the skeleton).

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
