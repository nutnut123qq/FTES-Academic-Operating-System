import useSWRInfinite from "swr/infinite"
import { queryMyNotifications } from "@/modules/api/graphql/queries/query-my-notifications"
import type { QueryNotificationData } from "@/modules/api/graphql/queries/types/notifications"
import { useAppSelector } from "@/redux/hooks"

/** Notifications per page for the `/notifications` center list. */
export const NOTIFICATION_LIST_PAGE_LIMIT = 20

/**
 * Offset-paginated SWR hook for the `/notifications` center list (infinite
 * scroll). Each page skips `index * NOTIFICATION_LIST_PAGE_LIMIT`; a page
 * shorter than the limit ends the list (`getKey` returns null — house pattern,
 * mirrored from `useQueryUserFollowersInfiniteSwr`). Auth-gated.
 *
 * Unlike the badge hook this list does NOT poll on an interval — the badge poll
 * is the shared freshness heartbeat. This hook only revalidates on focus and
 * after mark-read mutations, so an open-but-idle center issues no interval
 * requests. Re-keys on `unreadOnly` so switching the all/unread filter resets
 * pagination to the first page.
 *
 * @param unreadOnly - when true, only unread notifications are requested.
 */
export const useQueryMyNotificationsInfiniteSwr = (unreadOnly: boolean) => {
    const authenticated = useAppSelector((state) => state.keycloak.authenticated)

    const getKey = (
        index: number,
        previous: ReadonlyArray<QueryNotificationData> | null,
    ): readonly [string, boolean, number] | null => {
        if (!authenticated) {
            return null
        }
        // previous page came back short → no more rows, stop
        if (previous && previous.length < NOTIFICATION_LIST_PAGE_LIMIT) {
            return null
        }
        return [
            "QUERY_MY_NOTIFICATIONS_INFINITE_SWR",
            unreadOnly,
            index * NOTIFICATION_LIST_PAGE_LIMIT,
        ]
    }

    return useSWRInfinite(
        getKey,
        async ([, currentUnreadOnly, offset]) => {
            const result = await queryMyNotifications({
                request: {
                    limit: NOTIFICATION_LIST_PAGE_LIMIT,
                    offset,
                    unreadOnly: currentUnreadOnly,
                },
            })
            return result.data?.myNotifications?.data?.items ?? []
        },
        {
            // the badge hook owns the interval; this list refreshes on focus + mutation
            revalidateOnFocus: true,
        },
    )
}
