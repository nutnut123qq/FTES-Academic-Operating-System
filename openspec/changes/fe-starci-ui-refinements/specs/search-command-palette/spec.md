# search-command-palette

## MODIFIED Requirements

### Requirement: Open and close the search overlay
The system SHALL provide a global command-palette search opened from the navbar search
trigger or the Ctrl/Cmd+K shortcut, rendered as a **centered modal popup** (HeroUI `Modal`,
`rounded-2xl` or larger, flush padding) — NOT a right-anchored drawer and NOT an inline
dropdown anchored under a navbar field. The popup SHALL place the search input at the top of
the dialog with an `Esc` badge, render its result list inside the same popup body, and close
via Esc, backdrop press, or result navigation.

Nơi sửa: `src/components/features/search/SearchOverlay/index.tsx` (đổi `Drawer` → centered
`Modal`), `src/components/features/navbar/Navbar/index.tsx` (Ctrl/Cmd+K mở popup thay vì focus
inline field), `src/components/features/navbar/Navbar/SearchInline/index.tsx` +
`SearchInline/SearchDropdown.tsx` (bỏ dropdown-inline; nút search = trigger mở popup).

#### Scenario: Open via keyboard shortcut
- **GIVEN** the user is anywhere in the app shell with no other modal open
- **WHEN** the user presses Ctrl+K (or Cmd+K on macOS)
- **THEN** the centered search popup opens with the input focused
- **AND** the browser's default Ctrl/Cmd+K behavior is prevented

#### Scenario: Open via navbar search trigger
- **WHEN** the user presses the navbar search field/button
- **THEN** the centered search popup opens with the input focused
- **AND** no inline dropdown is anchored under the navbar

#### Scenario: Popup is a centered rounded modal
- **WHEN** the search popup is open on any viewport `sm` and up
- **THEN** it renders as a centered dialog with rounded corners (`rounded-2xl`+), the input at
  the top carrying an `Esc` badge, and the results inside the same dialog

#### Scenario: Footer key hints
- **WHEN** the search popup is open
- **THEN** a footer shows the shortcut hints for move (↑↓), open (⏎), and close (Esc)

#### Scenario: Close via Esc
- **GIVEN** the search popup is open
- **WHEN** the user presses Esc
- **THEN** the popup closes and focus returns to the element focused before opening

## ADDED Requirements

### Requirement: Popular suggestions in the idle palette
When the trimmed query is empty, the palette SHALL show a **"Phổ biến"** (Popular) section of
suggested courses instead of a dead-blank body, each row carrying a leading icon, the course
title, and its price. Selecting a suggestion SHALL navigate directly to that course and close
the popup. Device-local recent searches MAY be shown alongside.

Nơi sửa: nguồn gợi ý phổ biến (recommended/popular courses hook đã có) render trong
`SearchOverlay` body khi `query` rỗng; i18n `search.popular`.

#### Scenario: Idle palette shows popular courses
- **GIVEN** the search popup is open and the input is empty
- **WHEN** the user has not typed anything
- **THEN** a "Phổ biến" section lists popular courses (icon + title + price)

#### Scenario: Selecting a popular course navigates directly
- **WHEN** the user activates a popular-course row
- **THEN** the app navigates straight to that course and the popup closes

### Requirement: Direct navigation from palette results
Live results in the palette SHALL render each row with a leading kind icon, the entity title,
and a price or subtitle line. Activating a result (click or Enter on the active row) SHALL
navigate **directly to that entity** and close the popup, WITHOUT routing through an
intermediate `/search` results page.

Nơi sửa: `src/components/features/search/SearchOverlay/SearchOverlayResults/` +
`SearchResultRow`; hành vi activate trong `SearchOverlay/index.tsx`.

#### Scenario: Result row shows icon, title, and price
- **GIVEN** the palette has live results for a query
- **THEN** each result row shows a leading icon, the title, and a price/subtitle line

#### Scenario: Selecting a result skips the interstitial search page
- **WHEN** the user selects a result row
- **THEN** the app navigates directly to the selected entity's page
- **AND** the `/search` results page is not opened as an intermediate step
