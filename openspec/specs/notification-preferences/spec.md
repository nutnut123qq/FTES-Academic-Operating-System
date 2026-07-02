# notification-preferences Specification

## Purpose
TBD - created by archiving change push-notifications-nonrealtime. Update Purpose after archive.
## Requirements
### Requirement: Preferences surface on the notification center
The `/notifications` page SHALL expose a notification-preferences surface (opened from the
center header) containing one toggle per real `NotificationType` value (`system`,
`challengeGraded`, `codingGraded`, `milestoneGraded`, `newFollower`, `commentReply`,
`subscriptionGranted`, `announcement`) and a "mute all" master switch. All preference
strings SHALL be localized in `vi` and `en`, and every toggle SHALL have an accessible name
and be keyboard-operable.

#### Scenario: Open preferences
- **WHEN** the viewer activates the preferences control in the center header
- **THEN** the surface shows a labeled toggle per notification type plus a mute-all switch,
  each reflecting the stored preference state

#### Scenario: Keyboard toggle
- **WHEN** a keyboard user focuses a type toggle and presses Space
- **THEN** the toggle flips and the change is persisted exactly as a pointer toggle would

### Requirement: Preferences persisted via mock mutation
Preference state (`mutedTypes` + `muteAll`) SHALL be read through a
`myNotificationPreferences` query and written through an `updateMyNotificationPreferences`
mutation in the FE mock API layer (standard response envelope with nullable `data`); the
assumption that a real backend will persist these per user SHALL be recorded in the change
design, not invented as an existing API.

#### Scenario: Toggle persists across reload
- **WHEN** the viewer mutes a type and reloads the page
- **THEN** the preferences query returns the muted type and its toggle renders off

### Requirement: Muted types filtered from bell, center, and badge
Notifications whose type is muted SHALL be hidden from the bell popover list and the center
list, and unread notifications of muted types within the fetched page SHALL be excluded from
the badge count (documented approximation until the backend filters server-side). Toggling a
preference SHALL take effect on the next render/revalidation without a page reload.

#### Scenario: Preferences toggle effect
- **WHEN** the viewer mutes the `announcement` type while unread announcements exist
- **THEN** announcement rows disappear from the bell and center lists and the badge count
  drops by the number of fetched unread announcements

#### Scenario: Unmute restores
- **WHEN** the viewer re-enables a previously muted type
- **THEN** notifications of that type reappear in the lists and count toward the badge again

### Requirement: Mute all silences every surface
When "mute all" is enabled, the bell badge SHALL be hidden regardless of unread count, both
lists SHALL show an "all notifications muted" hint instead of rows, and per-type toggles
SHALL render disabled until mute-all is turned off. Polling MAY continue (data stays warm)
but SHALL produce no visible notification UI.

#### Scenario: Mute all
- **WHEN** the viewer enables mute-all with unread notifications present
- **THEN** the bell shows no badge and both lists show the muted hint in the active locale

### Requirement: Browser push opt-in slot is reserved but deferred
The preferences surface SHALL include a "browser push" row rendered as a disabled toggle
with localized "coming soon" helper text. This change SHALL NOT register a service worker,
request the Notifications permission, or create a push subscription — Web Push is explicitly
deferred until a backend can store subscriptions and send VAPID pushes (contract recorded in
the change design).

#### Scenario: Push row is inert
- **WHEN** the viewer views or attempts to activate the browser-push row
- **THEN** the toggle is disabled with the deferred/coming-soon helper text, and no
  permission prompt, service-worker registration, or subscription request occurs

