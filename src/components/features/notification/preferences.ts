import { NotificationType } from "@/modules/api/graphql/queries/types/notifications"
import type { NotificationItem } from "@/modules/api/rest/notification/types"
import type { QueryNotificationPreferencesData } from "@/modules/api/graphql/queries/types/notification-preferences"

/**
 * The (mock) preferences {@link NotificationType} values, in display order — the
 * source list rendered as per-type toggles in the preferences surface. NOTE: the
 * preferences store is a FE-only mock whose key space is distinct from the
 * delivered notifications' backend types, so per-type muting is cosmetic until a
 * real REST preferences integration lands; `muteAll` is the effective control.
 */
export const NOTIFICATION_TYPES: Array<NotificationType> = [
    NotificationType.System,
    NotificationType.ChallengeGraded,
    NotificationType.CodingGraded,
    NotificationType.MilestoneGraded,
    NotificationType.NewFollower,
    NotificationType.CommentReply,
    NotificationType.SubscriptionGranted,
    NotificationType.Announcement,
]

/**
 * Filter a delivered notification list against the viewer's preferences.
 * `muteAll` hides everything; otherwise notifications whose type is in
 * `mutedTypes` are dropped. A null/undefined preferences object is treated as
 * "nothing muted" (fail-open) so a preferences load error never hides real
 * notifications.
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
 * fits inside the fetched page (page size 20). A real backend would filter
 * server-side and return an exact count; this page-window subtraction is the
 * mock-phase stand-in.
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
