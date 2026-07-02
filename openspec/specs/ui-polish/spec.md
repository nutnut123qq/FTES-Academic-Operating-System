# ui-polish Specification

## Purpose
TBD - created by archiving change ui-polish-pass. Update Purpose after archive.
## Requirements
### Requirement: Softer global corner radius via shared tokens
The design system SHALL increase corner rounding by one notch at the shared token layer so cards, boxes, and surfaces read softer globally, applied through the radius tokens (`--radius`, `--field-radius` in `globals.css`) and the HeroUI theme radius plus the shared card/panel blocks — NOT per component. Pills, avatars, and small inputs/chips MUST retain their existing sensible radius (`rounded-full` stays full; inputs MUST NOT become pill-shaped), and child radius MUST NOT exceed its parent in concentric surfaces.

#### Scenario: Cards and surfaces render one notch rounder from tokens
- **GIVEN** the shared radius tokens and HeroUI theme radius are bumped one notch
- **WHEN** any card, panel, or surface built on the shared blocks renders
- **THEN** its corners are visibly rounder than before the bump
- **AND** the change came from the token/shared-block layer, not per-component overrides

#### Scenario: Pills, avatars, and inputs stay sensible
- **GIVEN** the radius bump is applied
- **WHEN** a pill, avatar, chip, or text input renders
- **THEN** pills and avatars remain fully round (`rounded-full`)
- **AND** inputs and chips keep a sensible non-pill radius

#### Scenario: Concentric surfaces keep child radius below parent
- **GIVEN** a card nested inside another surface
- **WHEN** both render after the bump
- **THEN** the inner surface radius is less than or equal to the outer surface radius

### Requirement: No obviously-fake placeholder person names in visible mock data
Visible mock data SHALL NOT display obviously-fake placeholder person names (e.g. "Nguyễn Văn A", "Nguyễn Văn X", "Nguyen Van A", "Người dùng A"). Such names MUST be replaced with realistic Vietnamese names or omitted where the name carries no meaning, across profile, community/comments, members, leaderboard, search, chat, recommendation, and subject surfaces. Legitimate real credited names (e.g. the "made by" / team credit) MUST be preserved, and any derived fields (avatar initials, handles, subtitles) MUST stay consistent with the replacement.

#### Scenario: Placeholder names are removed from visible surfaces
- **GIVEN** a scan for "Văn A", "Nguyễn Văn", "Nguyen Van", "Người dùng A" across the mock hooks and i18n messages
- **WHEN** a matched name renders on a visible surface (leaderboard, members, search, chat, recommendation, subject, comments)
- **THEN** it shows a realistic Vietnamese name instead, or the name is omitted where not needed
- **AND** avatar initials, handles, and subtitles match the replacement name

#### Scenario: Real credited names are preserved
- **GIVEN** a legitimate real name such as the "made by" or team credit
- **WHEN** the placeholder-name cleanup runs
- **THEN** that real name is left unchanged

### Requirement: Name positioned above the avatar on identity cards
Identity/person cards (mentor card, honor / "bảng vàng" achiever card, and similar profile person cards) SHALL position the person's NAME slightly above the avatar (name on top, avatar below or overlapping) per the reference layout, provided through a shared identity-block variant. The name MUST remain a real heading element for accessibility, DOM order MUST be name-then-avatar (no CSS re-order that desyncs screen-reader output), and the layout MUST stay responsive (center-stacked, avatar steps down on mobile, heading wraps without truncation).

#### Scenario: Mentor / achiever card shows name above avatar
- **GIVEN** a mentor or "bảng vàng" achiever card using the name-above variant
- **WHEN** the card renders
- **THEN** the name appears above the avatar (avatar below or overlapping)
- **AND** the name is a heading element with the avatar below it in DOM order

#### Scenario: Identity card stays accessible and responsive
- **GIVEN** the name-above identity card on a narrow viewport
- **WHEN** it renders
- **THEN** the content is center-stacked with a smaller avatar and the heading wraps without truncation
- **AND** screen-reader reading order is name then avatar

### Requirement: Progress shown as a labelled horizontal status bar
Progress indicators SHALL be presented as a labelled horizontal status bar (a state label plus percentage) rather than a bare percentage or hand-rolled thin bar, standardised on the shared `ProgressMeter` block, across course progress, profile progress, subject overview, and skill/career mastery. The bar MUST show a short state label (e.g. "Chưa bắt đầu / Đang học / Hoàn thành") together with the percentage so it reads without a separate legend, and values remain FE mock.

#### Scenario: Course progress renders as a status bar with a state label
- **GIVEN** the course progress surface with a mock completion percentage
- **WHEN** it renders
- **THEN** it shows a horizontal `ProgressMeter` bar with a state label and the percentage
- **AND** it no longer shows a bare percentage or a hand-rolled bar without a label

#### Scenario: Profile, subject, and mastery surfaces use the same status bar
- **GIVEN** a profile-progress, subject-overview, or skill/career-mastery surface with a mock percentage
- **WHEN** it renders
- **THEN** the percentage is shown through the labelled horizontal status bar
- **AND** the label communicates the state without a separate legend

### Requirement: Home landing follows the reference section layout
The home landing SHALL closely follow the StarCi reference section layout (section order and bottom-line composition), with `openspec/changes/home-landing-redesign` as the owning change for landing content. This change only records the reference-layout expectation and MUST NOT modify the `home-landing-redesign` change's files.

#### Scenario: Landing layout aligns with the reference and its owning change
- **GIVEN** the ui-polish-pass reference-layout note
- **WHEN** the home landing is designed or reviewed
- **THEN** its section order and composition follow the StarCi reference layout
- **AND** the note cross-references `home-landing-redesign` without editing that change's files

