## ADDED Requirements

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
All preview strings SHALL exist in both `vi` and `en` under the `courseSystem.browse.preview.*` namespace (updated line, outcomes heading, enroll CTA). The popover SHALL be purely supplementary for pointer users: all information and actions it exposes SHALL remain reachable through the course detail page, so keyboard and screen-reader users lose no capability when the popover never opens.

#### Scenario: Preview renders in the active locale
- **GIVEN** the locale is `en`
- **WHEN** a preview popover opens
- **THEN** its labels render in English, and in Vietnamese under `vi`

#### Scenario: Keyboard users lose no capability
- **GIVEN** a keyboard-only user who never triggers the hover preview
- **WHEN** they activate a course card
- **THEN** the course detail page provides all information and actions the popover offers
