# course-catalog-browse Specification

## Purpose
Browse-by-category course discovery: category model + mock hook (BE swap seam), category shelves, chip/tab bar, facet + sort bar, category landing page, shared upgraded course card, loading/empty states, i18n, a11y and SEO. Created by archiving change course-catalog-category-browse.
## Requirements
### Requirement: Course category model and data hook
The system SHALL model a course category taxonomy on the frontend via a `useQueryCourseCategoriesSwr` hook that returns an array of categories, each with a stable `id`, a URL `slug`, a localized `name` (vi + en), and an `icon`/`accent` for display. The taxonomy SHALL seed exactly three categories now — `math` (Toán), `programming` (Lập trình), and `foreign-languages` (Ngoại ngữ) — as a frontend-defined, BE-ready list. Every mock course SHALL carry exactly one category, referenced by category `slug`. The hook SHALL be SWR-shaped as a drop-in swap seam for a future backend category endpoint, and this is explicitly a frontend mock (the backend category contract is an assumption).

#### Scenario: Categories load with localized names
- **GIVEN** the catalog is rendered
- **WHEN** `useQueryCourseCategoriesSwr` resolves
- **THEN** it returns the three seed categories (`math`, `programming`, `foreign-languages`)
- **AND** each category exposes a `slug`, an `icon`/`accent`, and a `name` for both `vi` and `en`

#### Scenario: Active locale selects the category name
- **GIVEN** the app locale is `en`
- **WHEN** a category name is displayed
- **THEN** the English name is shown (e.g. "Programming"), and under `vi` the Vietnamese name (e.g. "Lập trình") is shown instead

#### Scenario: Every course maps to one category
- **GIVEN** the mock course data
- **WHEN** the courses load
- **THEN** every course has exactly one `category` slug that matches a seed category

### Requirement: Browse-by-category catalog layout
The `/courses` page SHALL present a browse-by-category experience composed, top to bottom, of: the existing featured hero slider, a category chip/tab bar, a facet + sort bar, and one horizontal shelf (carousel) per non-empty category. The featured hero slider SHALL remain unchanged at the top.

#### Scenario: Catalog renders one shelf per category
- **GIVEN** the mock courses cover all three categories
- **WHEN** `/courses` renders with no search or facet applied
- **THEN** the featured hero slider shows at the top
- **AND** below it a horizontal shelf renders for each category that has at least one course, in category order

#### Scenario: Empty category is hidden
- **GIVEN** a category has zero matching courses
- **WHEN** `/courses` renders
- **THEN** no shelf (and no empty placeholder) is rendered for that category

### Requirement: Category shelf is a horizontal carousel with "see all"
Each category shelf SHALL render a section header (category icon + localized name + a "Xem tất cả" link to the category landing page) above a horizontal, scroll-snap carousel of course cards. The shelf SHALL reuse the existing `useCarousel` scroll-snap primitive without adding any new dependency, SHALL support horizontal scroll/swipe, and SHALL NOT autoplay (only the hero slider autoplays).

#### Scenario: Shelf scrolls horizontally
- **GIVEN** a shelf has more course cards than fit the viewport
- **WHEN** the user swipes or activates the next control
- **THEN** the track scroll-snaps to reveal further cards
- **AND** the shelf never auto-advances on its own

#### Scenario: "See all" opens the category page
- **GIVEN** a category shelf for `programming`
- **WHEN** the user activates its "Xem tất cả" link
- **THEN** the app navigates to `/courses/category/programming`

### Requirement: Category chip/tab bar for quick jump
The catalog SHALL render a horizontal, scrollable category chip/tab bar (an "All" option plus one chip per category). Selecting a category chip SHALL jump/scroll the browse view to that category's shelf (or filter the browse view to it). The chip bar SHALL be exposed as an ARIA tablist with the active chip marked selected, and SHALL scroll horizontally on narrow viewports.

#### Scenario: Chip jumps to a category
- **GIVEN** the catalog shows shelves for all categories
- **WHEN** the user selects the "Lập trình" chip
- **THEN** the browse view scrolls to (or filters to) the programming shelf
- **AND** the selected chip is marked `aria-selected`

#### Scenario: Chip bar scrolls on mobile
- **GIVEN** a narrow (mobile) viewport where the chips overflow
- **WHEN** the chip bar renders
- **THEN** the chips remain reachable via horizontal scroll rather than wrapping into an unusable stack

### Requirement: Facet and sort bar
The catalog SHALL keep text search and level filtering, presented as a facet bar, and SHALL add a sort control with options `popular` (phổ biến, default), `newest` (mới), and `rating` (đánh giá). Search SHALL match across all categories on course code and name. Facets SHALL apply to the browse view on `/courses` and to the grid on the category page.

#### Scenario: Search spans all categories
- **GIVEN** the user types a query matching courses in more than one category
- **WHEN** the results update
- **THEN** matching courses from every category are shown (search is not scoped to a single category)

#### Scenario: Level and sort facets apply together
- **GIVEN** the user selects level `intermediate` and sort `rating`
- **WHEN** the view updates
- **THEN** only intermediate courses are shown, ordered by rating descending

#### Scenario: Default sort is popular
- **GIVEN** the catalog loads with no sort chosen
- **WHEN** courses render
- **THEN** they are ordered by the `popular` sort by default

### Requirement: Category landing page
The system SHALL provide a category landing page at route `/courses/category/[slug]` that renders a header (localized category name, description, and course count), the facet + sort bar, and a full responsive grid of that category's courses using the shared course card. An unknown slug SHALL resolve to a not-found state. The page SHALL be crawlable by search engines.

#### Scenario: Category page renders its courses
- **GIVEN** the slug `programming` with matching courses
- **WHEN** `/courses/category/programming` renders
- **THEN** the header shows the localized name, description, and course count
- **AND** a grid of that category's courses renders using the shared course card

#### Scenario: Category page filters its grid
- **GIVEN** the programming category page
- **WHEN** the user applies the level `basic` facet
- **THEN** only basic-level programming courses remain in the grid

#### Scenario: Empty category page shows empty state
- **GIVEN** a category (or facet combination) with no matching courses
- **WHEN** the category page renders
- **THEN** an explicit empty state is shown instead of an empty grid

#### Scenario: Unknown slug is not found
- **GIVEN** a slug that matches no category
- **WHEN** `/courses/category/[slug]` is requested
- **THEN** a not-found state is shown

### Requirement: Shared upgraded course card anatomy
The system SHALL provide a single reusable course card used by the category shelves, the main browse grid, and the category landing page. The card SHALL render, when the data is present: a cover/thumbnail (with a branded fallback when missing/broken), the course title, a level chip, a rating with rating count, a duration (hours) or credits, a price in VND, and an optional badge (Bán chạy for bestseller / Mới for new). Each field SHALL degrade gracefully — a missing field hides only its own element, not the card. The card SHALL link to the course detail page, and the save toggle SHALL NOT trigger card navigation.

#### Scenario: Card shows full anatomy when data present
- **GIVEN** a course with cover, rating, rating count, duration, price, and a bestseller flag
- **WHEN** its card renders
- **THEN** the cover, title, level chip, rating + count, duration, VND price, and a "Bán chạy" badge all render

#### Scenario: Card without rating hides the rating row
- **GIVEN** a course with no rating
- **WHEN** its card renders
- **THEN** no stars or rating count are shown, and the rest of the card renders normally

#### Scenario: Card without a badge shows no badge
- **GIVEN** a course that is neither bestseller nor new
- **WHEN** its card renders
- **THEN** no badge ribbon is shown

#### Scenario: Missing cover uses branded fallback
- **GIVEN** a course whose cover image is absent or fails to load
- **WHEN** its card renders
- **THEN** the branded gradient fallback is shown in place of the image

#### Scenario: Save toggle does not navigate
- **GIVEN** a course card with a save toggle
- **WHEN** the user activates the save toggle
- **THEN** the save state changes and the app does NOT navigate to the course detail page

### Requirement: Loading skeletons mirror the layout
The catalog and category page SHALL show loading skeletons that mirror the real layout while course/category data is loading: shelf skeletons on `/courses` (a header bar plus a row of card skeletons per shelf) and a grid skeleton on the category page. Skeletons SHALL be gated on the loading/no-data state, and static chrome SHALL NOT be part of the skeleton.

#### Scenario: Catalog shows shelf skeletons while loading
- **GIVEN** course/category data has not resolved
- **WHEN** `/courses` renders
- **THEN** shelf-shaped skeletons (header bar + a row of card skeletons) are shown in place of the real shelves

#### Scenario: Category page shows a grid skeleton while loading
- **GIVEN** the category page data has not resolved
- **WHEN** the page renders
- **THEN** a grid of card skeletons mirrors the eventual grid layout

### Requirement: Responsive mobile browse
On narrow (mobile) viewports the catalog SHALL keep the browse experience usable: category shelves SHALL be swipeable horizontally, and the category chip bar SHALL scroll horizontally rather than wrapping.

#### Scenario: Shelves swipe on mobile
- **GIVEN** a mobile viewport
- **WHEN** the user swipes a category shelf
- **THEN** the shelf scroll-snaps through its cards via native touch scrolling

#### Scenario: Chips scroll on mobile
- **GIVEN** a mobile viewport where chips overflow the width
- **WHEN** the chip bar renders
- **THEN** the chips are reachable by horizontal scroll

### Requirement: Internationalization of browse UI
All new browse and category UI strings SHALL be provided for both `vi` and `en` locales under the `courseSystem.categories.*` and `courseSystem.browse.*` namespaces (including category names, the "Xem tất cả" link, sort option labels, badge labels, empty states, and facet labels). No user-facing string SHALL be hard-coded.

#### Scenario: Browse UI renders in the active locale
- **GIVEN** the locale is `en`
- **WHEN** the catalog and category page render
- **THEN** category names, the "see all" link, sort labels, badges, and empty states appear in English, and switching to `vi` shows the Vietnamese equivalents

#### Scenario: New keys exist for both locales
- **GIVEN** the `courseSystem.categories.*` and `courseSystem.browse.*` keys
- **WHEN** the vi and en message catalogs are checked
- **THEN** every new key is present in both locales

### Requirement: Accessibility of carousel and tablist
The browse UI SHALL be accessible: each category shelf carousel region SHALL be labelled and its previous/next controls SHALL be real buttons with `aria-label`s; the category chip/tab bar SHALL use ARIA tablist/tab semantics with the active tab marked selected; and the shared card's cover image SHALL carry appropriate alt text.

#### Scenario: Carousel controls are labelled
- **GIVEN** a category shelf with navigation controls
- **WHEN** a screen reader inspects them
- **THEN** the carousel region is labelled and the previous/next controls expose `aria-label`s

#### Scenario: Chip bar exposes tablist semantics
- **GIVEN** the category chip/tab bar
- **WHEN** a screen reader inspects it
- **THEN** it is announced as a tablist, each chip as a tab, and the active chip as selected

### Requirement: Category pages are SEO crawlable
Category landing pages SHALL be crawlable: category slugs form a known finite set, each `/courses/category/[slug]` page SHALL render meaningful content server-side (title/header/description), so search engines and deep links resolve a real page per category.

#### Scenario: Each category slug resolves a crawlable page
- **GIVEN** the finite set of category slugs
- **WHEN** a crawler requests `/courses/category/[slug]` for a known slug
- **THEN** the page returns meaningful, indexable content (header, description, course list) rather than an empty client-only shell

### Requirement: Course card hover preview popover
On hover-capable desktop devices (`(hover: hover) and (pointer: fine)`), hovering a shared catalog course card SHALL — after a short delay (~300ms) — open a detail preview popover positioned beside the card. The popover SHALL render, when the data is present: the course title, the merchandising badge (Bán chạy/Mới) and level chip, an "updated <month/year>" line, a meta line (total hours · level · lesson count), a short description, up to three "what you'll learn" outcomes with checkmarks, a primary enroll CTA that navigates to the course detail page, and a wishlist (save) toggle. Each field SHALL degrade gracefully — a missing field hides only its own row, never the popover. The enroll CTA copy SHALL be enroll-oriented ("Đăng ký khóa học" / "Enroll"), NOT membership/VIP wording.

#### Scenario: Hover opens the preview after a delay
- **GIVEN** a desktop viewport with a fine pointer
- **WHEN** the user hovers a catalog course card and keeps the pointer there past the delay
- **THEN** a preview popover opens beside the card showing title, badges, updated line, meta, description, outcomes, enroll CTA and save toggle

#### Scenario: Leaving the card closes the preview
- **WHEN** the pointer leaves both the card and the popover
- **THEN** the popover closes
- **AND** moving the pointer from the card into the popover keeps it open (the popover is interactive)

#### Scenario: Popover flips to stay in the viewport
- **GIVEN** a card near the right edge of the viewport
- **WHEN** its preview opens
- **THEN** the popover renders on the left side of the card instead, staying fully within the viewport

#### Scenario: Enroll CTA navigates to the course detail
- **WHEN** the user activates the enroll CTA inside the popover
- **THEN** the app navigates to that course's detail page

#### Scenario: Save toggle inside the popover does not navigate
- **WHEN** the user activates the save toggle inside the popover
- **THEN** the save state toggles and no navigation happens

#### Scenario: Missing optional fields hide only their rows
- **GIVEN** a course without `description` or `learnOutcomes`
- **WHEN** its preview opens
- **THEN** those rows are absent while the rest of the popover renders normally

### Requirement: Hover preview is desktop-only
The hover preview SHALL NOT activate on touch/coarse-pointer devices: tapping a card SHALL keep its existing navigate-to-detail behavior, with no popover shown and no extra tap required.

#### Scenario: Touch devices keep tap-to-navigate
- **GIVEN** a touch device without hover capability
- **WHEN** the user taps a catalog course card
- **THEN** the app navigates straight to the course detail page and no preview popover appears

### Requirement: Course model preview fields (mock)
The mock `Course` model SHALL be extended with optional preview fields: `description` (short summary), `learnOutcomes` (list of outcome strings) and `updatedAt` (ISO date). These are frontend mocks assumed to be provided by the future course list endpoint; absence of any field SHALL NOT break the card or the preview.

#### Scenario: Mock courses carry preview fields
- **WHEN** the mock course list resolves
- **THEN** courses expose `description`, `learnOutcomes` and `updatedAt` values used by the preview popover

### Requirement: Hover preview internationalization and accessibility
All preview strings SHALL exist in both `vi` and `en` under the `courseSystem.browse.preview.*` namespace (updated line, enroll CTA). The popover SHALL be purely supplementary for pointer users: all information and actions it exposes SHALL remain reachable through the course detail page, so keyboard and screen-reader users lose no capability when the popover never opens.

#### Scenario: Preview renders in the active locale
- **GIVEN** the locale is `en`
- **WHEN** a preview popover opens
- **THEN** its labels render in English, and in Vietnamese under `vi`

#### Scenario: Keyboard users lose no capability
- **GIVEN** a keyboard-only user who never triggers the hover preview
- **WHEN** they activate a course card
- **THEN** the course detail page provides all information and actions the popover offers
