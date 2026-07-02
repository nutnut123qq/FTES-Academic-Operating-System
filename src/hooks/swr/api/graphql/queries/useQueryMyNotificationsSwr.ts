import useSWR from "swr"
import { queryMyNotifications } from "@/modules/api/graphql/queries/query-my-notifications"
import type { QueryMyNotificationsData } from "@/modules/api/graphql/queries/types/notifications"
import { useAppSelector } from "@/redux/hooks"

/** How many recent notifications the badge/bell page fetches at once. */
const BELL_LIMIT = 20

/** Throttle window (ms) for on-focus revalidation, so tab-switching isn't chatty. */
const FOCUS_THROTTLE_MS = 5_000

/**
 * SWR wrapper for {@link queryMyNotifications}. `data` is the viewer's recent
 * notification page (newest first, page 0) plus the `unreadCount` for the badge,
 * or `null`. User-scoped — only runs once authenticated.
 *
 * **Polling is THE delivery mechanism for notifications** (non-realtime, by
 * product decision — no Socket.io subscription is wired). This hook owns the
 * heartbeat: a 60s interval keeps the badge fresh, `refreshWhenHidden: false`
 * makes the interval visibility-aware (SWR suspends polling while the tab is
 * hidden and resumes when it becomes visible again), and focus/reconnect
 * revalidation gives a returning viewer an immediate catch-up. The center's
 * paginated list shares this cache key but does NOT poll — the badge poll is the
 * single freshness heartbeat for both surfaces.
 */
export const useQueryMyNotificationsSwr = () => {
    const authenticated = useAppSelector((state) => state.keycloak.authenticated)
    return useSWR<QueryMyNotificationsData | null>(
        authenticated ? ["QUERY_MY_NOTIFICATIONS_SWR"] : null,
        async () => {
            // unwrap the standard API envelope; null when absent
            const result = await queryMyNotifications({
                request: {
                    limit: BELL_LIMIT,
                },
            })
            return result.data?.myNotifications?.data ?? null
        },
        {
            // polling = delivery: 60s cadence, paused while the tab is hidden
            refreshInterval: 60_000,
            refreshWhenHidden: false,
            // immediate catch-up when the viewer returns / the network reconnects
            revalidateOnFocus: true,
            focusThrottleInterval: FOCUS_THROTTLE_MS,
            revalidateOnReconnect: true,
        },
    )
}
