import type { NotificationType } from "./notifications"

/**
 * The current user's notification preferences: the set of muted types plus a
 * master "mute all" switch.
 *
 * Derived from the real BE preference matrix
 * (`GET /api/v1/notifications/preferences`): a type is muted ⇔ its
 * `(type, IN_APP)` cell is disabled, and `muteAll` ⇔ every type's IN_APP cell
 * is disabled (see `modules/api/rest/notification/preferences.ts`). The BE
 * enforces these preferences at dispatch time (`PreferenceMuteResolver`), so
 * the client-side filter over the bell/center/badge only hides notifications
 * delivered BEFORE the user muted their type.
 */
export interface QueryNotificationPreferencesData {
    /** Notification types the user has muted (hidden + excluded from the badge). */
    mutedTypes: Array<NotificationType>
    /** When true, every notification surface is silenced regardless of type. */
    muteAll: boolean
}
