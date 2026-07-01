import useSWR from "swr"
import { queryMyNotifications } from "@/modules/api/graphql/queries/query-my-notifications"
import type { QueryMyNotificationsData } from "@/modules/api/graphql/queries/types/notifications"
import { useAppSelector } from "@/redux/hooks"

/** How many recent notifications the bell list fetches at once. */
const BELL_LIMIT = 20

/**
 * SWR wrapper for {@link queryMyNotifications}. `data` is the viewer's recent
 * notification page (newest first) plus the `unreadCount` for the badge, or
 * `null`. User-scoped — only runs once authenticated. Polls in the background so
 * the badge stays roughly fresh even without the realtime socket.
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
            // keep the badge roughly fresh between realtime socket pushes
            refreshInterval: 60_000,
        },
    )
}
