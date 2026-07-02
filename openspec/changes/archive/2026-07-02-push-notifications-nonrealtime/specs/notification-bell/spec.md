# notification-bell — Delta Spec

## ADDED Requirements

### Requirement: Bell popover backed by the shared real notification query
The navbar bell SHALL read its data from the real `myNotifications` GraphQL query through
the shared badge SWR hook (`useQueryMyNotificationsSwr`, single cache key), the same source
the `/notifications` center consumes, so the bell and the full page never show divergent
content. Mark-read actions performed in either surface SHALL be visible in the other after
cache revalidation.

#### Scenario: Bell and center agree on real data
- **WHEN** the bell popover is opened
- **THEN** the notifications it lists come from the `myNotifications` query and match what
  the `/notifications` page shows for the same rows

#### Scenario: Cross-surface mark read
- **WHEN** the viewer marks a notification read on the `/notifications` page
- **THEN** after revalidation the bell shows that notification without its unread dot and
  the badge count reflects it

## MODIFIED Requirements

### Requirement: Shared type→icon map
The mapping from notification type to icon SHALL be defined once, keyed by the real
`NotificationType` enum (`system`, `challengeGraded`, `codingGraded`, `milestoneGraded`,
`newFollower`, `commentReply`, `subscriptionGranted`, `announcement`), and reused by both
the bell popover rows and the `NotificationCenter` page. The legacy seven-key mock-type map
SHALL be removed.

#### Scenario: Consistent icons
- **WHEN** a notification of a given `NotificationType` is rendered in either the bell or
  the center
- **THEN** the same icon is used in both places

#### Scenario: Every real type has an icon
- **WHEN** the icon map is consulted for any value of the `NotificationType` enum
- **THEN** a concrete icon is returned (no fallback gap for any of the eight types)

## REMOVED Requirements

### Requirement: Bell popover backed by the shared notification mock
**Reason**: The bell no longer reads the FE mock feed — both the bell and the center are
unified onto the real `myNotifications` GraphQL query, and the mock hook
(`useQueryNotificationsSwr`) is deleted.
**Migration**: Covered by the ADDED requirement "Bell popover backed by the shared real
notification query"; consumers import the shared badge SWR hook instead of the mock hook.
