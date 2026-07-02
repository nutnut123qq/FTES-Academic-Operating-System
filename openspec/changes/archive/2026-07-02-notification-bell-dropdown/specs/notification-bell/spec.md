## ADDED Requirements

### Requirement: Bell popover backed by the shared notification mock
The navbar bell SHALL read its data from the same FE mock source as the `/notifications`
center (`useQueryNotificationsSwr`), so the bell and the full page never show divergent
content.

#### Scenario: Bell and center agree
- **WHEN** the bell popover is opened
- **THEN** the notifications it lists are drawn from the same mock feed the `/notifications`
  page renders

### Requirement: Unread-count badge
The bell icon SHALL show a badge with the number of unread notifications, and SHALL hide the
badge when there are none.

#### Scenario: Some unread
- **WHEN** at least one notification is unread
- **THEN** the bell shows a badge with the unread count (capped label for large counts)

#### Scenario: None unread
- **WHEN** no notification is unread
- **THEN** no badge is shown on the bell

### Requirement: Recent-items popover
The bell popover SHALL show a header titled "Thông báo" with a "mark all read" link, the ~5
most-recent notifications (each with a type icon, text, relative time, and an unread dot when
unread), and a footer link to the full notification center.

#### Scenario: Open the popover
- **WHEN** the user opens the bell
- **THEN** the header, at most the 5 newest notifications, and a "Xem tất cả" footer link are shown

#### Scenario: Mark all read
- **WHEN** the user activates the "mark all read" link
- **THEN** the unread badge and per-item unread dots clear in the popover

#### Scenario: View all
- **WHEN** the user activates the "Xem tất cả" footer link
- **THEN** the app navigates to the `/notifications` center

### Requirement: Shared type→icon map
The mapping from notification type to icon SHALL be defined once and reused by both the bell
and the `NotificationCenter` page.

#### Scenario: Consistent icons
- **WHEN** a notification of a given type is rendered in either the bell or the center
- **THEN** the same icon is used in both places

### Requirement: Notifications removed from sidebar nav
The sidebar "you" nav group SHALL NOT include a "Notifications" row; it retains Activity and
Wallet. The `/notifications` route and its path builder remain available (reached via the bell footer).

#### Scenario: Sidebar has no notifications row
- **WHEN** the sidebar nav renders
- **THEN** the "you" group shows Activity and Wallet and no Notifications row

#### Scenario: Route still reachable
- **WHEN** the user follows the bell's "Xem tất cả" link
- **THEN** the existing `/notifications` page loads unchanged
