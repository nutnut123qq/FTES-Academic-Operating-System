# user-hovercard-surface Specification

## Purpose
TBD - created by archiving change fix-user-hovercard-surface. Update Purpose after archive.
## Requirements
### Requirement: Hovercard popup has an opaque floating surface
The `UserHovercard` popup SHALL render with a non-transparent background, a semantic border, rounded corners, and a shadow so it does not visually merge with the feed behind it.

#### Scenario: Popup opens over the community feed
- **WHEN** a user hovers over a user name in `/vi/community`
- **THEN** the popup card displays with an opaque surface that fully covers the feed text below it

#### Scenario: Popup has border, radius, and shadow
- **WHEN** the hovercard is visible
- **THEN** the popup shell has a visible border, rounded corners, and a drop shadow consistent with other floating surfaces in the app

### Requirement: Popover arrow matches the card background
The popup arrow SHALL fill with the same background color as the card body so the arrow does not appear transparent or mismatched.

#### Scenario: Arrow points at the trigger
- **WHEN** the hovercard is rendered with a placement that shows the arrow
- **THEN** the arrow fill matches the popup background color

### Requirement: Popup motion is smooth
The popup SHALL animate in and out with a short fade/translate/scale transition instead of appearing or disappearing instantly.

#### Scenario: Hovering opens the card
- **WHEN** the user hovers the trigger
- **THEN** the popup fades in and scales/slides slightly over ~120–160 ms

#### Scenario: Leaving closes the card
- **WHEN** the user moves the pointer away and the grace period expires
- **THEN** the popup fades out and scales down slightly before unmounting

### Requirement: Existing interaction behavior is preserved
The styling changes SHALL NOT alter open/close timers, grace period, `Esc` dismissal, click/tap navigation, touch suppression, or keyboard focus behavior.

#### Scenario: Pointer crosses from trigger to popup
- **WHEN** the user moves the pointer from the user name into the popup within the grace period
- **THEN** the popup stays open

#### Scenario: Touch device tap
- **WHEN** a user taps the user name on a touch device
- **THEN** the popup does not open and the trigger navigates as before

#### Scenario: Keyboard focus
- **WHEN** the trigger receives keyboard focus
- **THEN** the popup opens after the configured delay

#### Scenario: Escape key
- **WHEN** the popup is open and the user presses `Escape`
- **THEN** the popup closes immediately

