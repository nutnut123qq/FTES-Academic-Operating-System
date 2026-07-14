import { NotificationType } from "@/modules/api/graphql/queries/types/notifications"
import type { NotificationItem } from "@/modules/api/rest/notification/types"
import type { QueryNotificationPreferencesData } from "@/modules/api/graphql/queries/types/notification-preferences"

/**
 * The 8 real backend {@link NotificationType} values, in display order — the
 * source list rendered as per-type toggles in the preferences surface. The key
 * space matches `item.type` on delivered rows AND the preference-matrix cells,
 * so toggling a type here mutes exactly that type end-to-end.
 */
export const NOTIFICATION_TYPES: Array<NotificationType> = [
    NotificationType.Mention,
    NotificationType.Course,
    NotificationType.Event,
    NotificationType.Deadline,
    NotificationType.Challenge,
    NotificationType.Coin,
    NotificationType.Group,
    NotificationType.System,
]

/**
 * Filter a delivered notification list against the viewer's preferences.
 * `muteAll` hides everything; otherwise notifications whose type is in
 * `mutedTypes` are dropped. A null/undefined preferences object is treated as
 * "nothing muted" (fail-open) so a preferences load error never hides real
 * notifications.
 *
 * NOTE: the BE enforces IN_APP preferences at dispatch time
 * (`PreferenceMuteResolver`) — a muted type is never written to the user's
 * notification list anymore — so this filter only hides the OLD backlog
 * delivered before the user muted the type.
 *
 * @param items - the delivered notification rows.
 * @param preferences - the viewer's preferences, or null when not loaded.
 * @returns the visible subset of `items`.
 */
export const filterNotificationsByPreferences = (
    items: Array<NotificationItem>,
    preferences: QueryNotificationPreferencesData | null | undefined,
): Array<NotificationItem> => {
    if (!preferences) {
        return items
    }
    if (preferences.muteAll) {
        return []
    }
    if (preferences.mutedTypes.length === 0) {
        return items
    }
    const muted = new Set<string>(preferences.mutedTypes)
    return items.filter((item) => !muted.has(item.type))
}

/**
 * Derive the badge unread count after applying preferences to a fetched page.
 * `muteAll` forces zero; otherwise the raw `unreadCount` is reduced by the
 * number of unread rows of muted types *within the fetched page*.
 *
 * **Documented approximation (design D5):** exact only when the unread window
 * fits inside the fetched page (page size 20). Since the BE now enforces
 * preferences at dispatch, this subtraction only applies to the OLD unread
 * backlog delivered before the user muted a type — new notifications of a
 * muted type are never created, so the drift disappears as the backlog is read.
 *
 * @param rawUnreadCount - the server `unreadCount` for the fetched page.
 * @param fetchedItems - the notification rows on the fetched page.
 * @param preferences - the viewer's preferences, or null when not loaded.
 * @returns the badge count after applying preferences.
 */
export const deriveMutedAwareUnreadCount = (
    rawUnreadCount: number,
    fetchedItems: Array<NotificationItem>,
    preferences: QueryNotificationPreferencesData | null | undefined,
): number => {
    if (!preferences) {
        return rawUnreadCount
    }
    if (preferences.muteAll) {
        return 0
    }
    if (preferences.mutedTypes.length === 0) {
        return rawUnreadCount
    }
    const muted = new Set<string>(preferences.mutedTypes)
    const mutedUnread = fetchedItems.filter(
        (item) => !item.isRead && muted.has(item.type),
    ).length
    return Math.max(0, rawUnreadCount - mutedUnread)
}
