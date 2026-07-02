# notification-center — Delta Spec

## ADDED Requirements

### Requirement: Center backed by the real notification query
The `/notifications` page SHALL read from the real `myNotifications` GraphQL query (the same
API the navbar bell uses) instead of the FE mock hook, rendering each notification's i18n
title (`t(key, params)`), optional i18n body, per-type icon from the shared
`NotificationType`-keyed icon map, relative timestamp, and an unread indicator.

#### Scenario: Center and bell agree
- **WHEN** the `/notifications` page and the bell popover are both rendered
- **THEN** both list notifications from the `myNotifications` query and a notification
  visible in one is visible in the other (within the bell's page-size window)

#### Scenario: Unauthenticated viewer
- **WHEN** the viewer is not authenticated
- **THEN** the center fetches nothing and renders no notification rows

### Requirement: Paginated list with infinite scroll
The center SHALL load notifications in pages via the query's `limit`/`offset` arguments and
SHALL load the next page when the viewer scrolls to a sentinel at the end of the list,
stopping when a page returns fewer rows than the page size.

#### Scenario: Load more on scroll
- **WHEN** the viewer scrolls to the end of a full page of notifications
- **THEN** the next page is fetched with an increased offset and appended to the list

#### Scenario: Last page reached
- **WHEN** a fetched page contains fewer rows than the requested limit
- **THEN** no further page request is made when the sentinel is reached again

### Requirement: All/unread filter backed by the server
The center SHALL offer an "all" and an "unread" filter; the unread filter SHALL request
`unreadOnly: true` from the query rather than filtering client-side, and switching filters
SHALL reset pagination to the first page.

#### Scenario: Filter unread
- **WHEN** the viewer activates the "unread" filter
- **THEN** the list refetches with `unreadOnly: true` from offset 0 and shows only unread
  notifications

#### Scenario: Unread filter emptied by reading
- **WHEN** the "unread" filter is active and the viewer marks the last unread notification
  read
- **THEN** after revalidation the list shows the empty state

### Requirement: Mark single and mark all read
The center SHALL mark a notification read via `markNotificationAsRead` when its row is
activated, and SHALL provide a "mark all read" action calling `markAllNotificationsAsRead`;
both actions SHALL revalidate the shared notification caches so the bell badge reflects the
change without a page reload. The "mark all read" action SHALL be disabled when nothing is
unread.

#### Scenario: Mark one read
- **WHEN** the viewer activates an unread notification row
- **THEN** the row loses its unread indicator and, after revalidation, the bell badge count
  decreases accordingly

#### Scenario: Mark all read
- **WHEN** the viewer activates "mark all read" with unread notifications present
- **THEN** all rows lose their unread indicator and the bell badge disappears after
  revalidation

### Requirement: Route resolution on click
When an activated notification has a snapshotted target, the center SHALL resolve it through
the `resolveRoute` query using the base64url global id `<entityName>:<id>` and navigate to
the locale-prefixed resolved path; targetless notifications SHALL only be marked read.

#### Scenario: Click routes to target
- **WHEN** the viewer activates a notification with a target and route resolution returns a
  path
- **THEN** the app navigates to `/<locale><path>`

#### Scenario: Targetless notification
- **WHEN** the viewer activates a notification whose `target` is null
- **THEN** the notification is marked read and no navigation occurs

### Requirement: Localized and accessible center
The center SHALL source all strings (title, subtitle, filters, mark actions, empty states,
unread label) from i18n messages with both `vi` and `en` translations. Notification rows
SHALL be keyboard-activatable buttons/links with accessible names, and the unread indicator
SHALL carry a text alternative.

#### Scenario: i18n vi/en
- **WHEN** the locale is switched between `vi` and `en`
- **THEN** every center string renders in the active locale with no raw message keys visible

#### Scenario: Keyboard operation
- **WHEN** a keyboard user tabs to a notification row and presses Enter
- **THEN** the row activates exactly as a pointer click would (mark read + navigate)
