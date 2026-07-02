import type { GraphQLResponse } from "../../types"
import type { NotificationType } from "./notifications"

/**
 * The current user's notification preferences: the set of muted types plus a
 * master "mute all" switch. Applied client-side as a filter over the delivered
 * notification list (bell + center + badge) until a real backend filters
 * server-side.
 */
export interface QueryNotificationPreferencesData {
    /** Notification types the user has muted (hidden + excluded from the badge). */
    mutedTypes: Array<NotificationType>
    /** When true, every notification surface is silenced regardless of type. */
    muteAll: boolean
}

/** Apollo response shape for the `myNotificationPreferences` query. */
export interface QueryNotificationPreferencesResponse {
    /** Top-level `myNotificationPreferences` field wrapping the standard envelope. */
    myNotificationPreferences: GraphQLResponse<QueryNotificationPreferencesData>
}
