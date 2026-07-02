# notification-polling — Delta Spec

## ADDED Requirements

### Requirement: Polling is the sole delivery mechanism
Notification freshness SHALL be driven by SWR polling of the `myNotifications` query — no
realtime socket subscription SHALL be wired for notifications. The badge hook
(`useQueryMyNotificationsSwr`) SHALL poll at a 60-second interval while the viewer is
authenticated.

#### Scenario: Badge updates after a poll
- **WHEN** a new unread notification is created server-side and the next 60s poll completes
- **THEN** the bell badge count increases without any user interaction or page reload

#### Scenario: No socket wiring
- **WHEN** the notification surfaces are mounted
- **THEN** no Socket.io notification subscription is opened; data changes arrive only via
  polling and explicit revalidation

### Requirement: Polling pauses while the tab is hidden
The badge poll SHALL NOT fire while the document is hidden (SWR `refreshWhenHidden: false`,
i.e. visibility-aware), and SHALL resume its interval when the document becomes visible
again.

#### Scenario: Tab-hidden pause
- **WHEN** the viewer switches to another tab for several minutes
- **THEN** no `myNotifications` poll requests are issued while the tab is hidden

### Requirement: Immediate refetch on focus
The badge hook SHALL revalidate immediately (throttled to roughly once per 5 seconds) when
the window regains focus, and SHALL revalidate on network reconnect, so a returning viewer
sees fresh counts without waiting for the next interval tick.

#### Scenario: Catch-up on focus
- **WHEN** the viewer returns to the tab after notifications changed server-side
- **THEN** a revalidation fires on focus and the badge reflects the current unread count
  within the focus-throttle window

### Requirement: One shared badge cache, non-polling center list
The bell and the `/notifications` page SHALL share the badge query's SWR cache key so a
single poll updates both surfaces; the center's paginated list hook SHALL NOT itself poll on
an interval — it revalidates on focus and after mark-read mutations.

#### Scenario: Single poll, both surfaces
- **WHEN** a badge poll returns a changed `unreadCount`
- **THEN** the bell badge and any mounted consumer of the shared key reflect the new value
  from one network request

#### Scenario: Center does not double-poll
- **WHEN** the `/notifications` page is open and idle
- **THEN** only the badge hook's 60s poll issues interval requests; the paginated list hook
  issues none
