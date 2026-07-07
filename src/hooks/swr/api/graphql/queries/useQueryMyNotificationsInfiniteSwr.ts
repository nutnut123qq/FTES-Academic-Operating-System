import useSWRInfinite from "swr/infinite"
import { getNotifications } from "@/modules/api/rest/notification/notification"
import type { NotificationItem } from "@/modules/api/rest/notification/types"
import { useAppSelector } from "@/redux/hooks"

/** Notifications per page for the `/notifications` center list. */
export const NOTIFICATION_LIST_PAGE_LIMIT = 20

/**
 * Page-paginated SWR hook for the `/notifications` center list (infinite
 * scroll), backed by the real BE REST notifications API
 * (`GET /api/v1/notifications?page&size&status`). Each key requests the next
 * 0-based `page`; a page shorter than the limit ends the list (`getKey` returns
 * null — house pattern, mirrored from `useQueryUserFollowersInfiniteSwr`).
 * Auth-gated.
 *
 * Unlike the badge hook this list does NOT poll on an interval — the badge poll
 * is the shared freshness heartbeat. This hook only revalidates on focus and
 * after mark-read mutations, so an open-but-idle center issues no interval
 * requests. Re-keys on `unreadOnly` so switching the all/unread filter resets
 * pagination to the first page (the filter maps to the server `status=UNREAD`).
 *
 * @param unreadOnly - when true, only unread notifications are requested.
 */
export const useQueryMyNotificationsInfiniteSwr = (unreadOnly: boolean) => {
    const authenticated = useAppSelector((state) => state.keycloak.authenticated)

    const getKey = (
        index: number,
        previous: ReadonlyArray<NotificationItem> | null,
    ): readonly [string, boolean, number] | null => {
        if (!authenticated) {
            return null
        }
        // previous page came back short → no more rows, stop
        if (previous && previous.length < NOTIFICATION_LIST_PAGE_LIMIT) {
            return null
        }
        return ["QUERY_MY_NOTIFICATIONS_INFINITE_SWR", unreadOnly, index]
    }

    return useSWRInfinite(
        getKey,
        async ([, currentUnreadOnly, pageIndex]) => {
            const page = await getNotifications({
                page: pageIndex,
                size: NOTIFICATION_LIST_PAGE_LIMIT,
                status: currentUnreadOnly ? "UNREAD" : undefined,
            })
            return page.items
        },
        {
            // the badge hook owns the interval; this list refreshes on focus + mutation
            revalidateOnFocus: true,
        },
    )
}
