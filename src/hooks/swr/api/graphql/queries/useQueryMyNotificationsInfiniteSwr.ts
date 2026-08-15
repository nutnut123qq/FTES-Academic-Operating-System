import useSWRInfinite from "swr/infinite"
import { getNotifications } from "@/modules/api/rest/notification/notification"
import type { NotificationItem } from "@/modules/api/rest/notification/types"
import { useAppSelector } from "@/redux/hooks"
import { useViewerScopeId } from "@/hooks/swr/viewerScope"

/** Notifications per page for the `/notifications` center list. */
export const NOTIFICATION_LIST_PAGE_LIMIT = 20

/** One page's cache key: filter + page index + the VIEWER the page belongs to. */
export type MyNotificationsInfinitePageKey = readonly [string, boolean, number, string]

/**
 * THE ONE key builder for the notification-center infinite list — the page-key
 * loader `useSWRInfinite` gets, and the exact same function any call site must
 * feed `unstable_serialize` to reach the list's `$inf$` meta key.
 *
 * Exported (rather than re-typed at the call site) because the SSE lifecycle
 * rebuilds this key to push live notifications into the list: two hand-written
 * copies of the same array drift the moment one side gains a segment — and a
 * mutate whose key no longer matches is a SILENT no-op (pushed notifications
 * would simply stop appearing until a reload).
 *
 * @param unreadOnly - the all/unread filter the list is showing.
 * @param viewerId - the signed-in viewer's id ({@link useViewerScopeId}).
 */
export const buildMyNotificationsInfiniteKey =
    (unreadOnly: boolean, viewerId: string) =>
    (index: number): MyNotificationsInfinitePageKey =>
        ["QUERY_MY_NOTIFICATIONS_INFINITE_SWR", unreadOnly, index, viewerId]

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
 * The key also carries the VIEWER ID ({@link useViewerScopeId}): "somebody is signed
 * in" is not an identity, so on the bare key signing out of A and into B in the same
 * tab re-keys to the SAME entry and B is served A's notifications from the cache
 * (stale-while-revalidate, and inside `dedupingInterval` without even a refetch).
 *
 * @param unreadOnly - when true, only unread notifications are requested.
 */
export const useQueryMyNotificationsInfiniteSwr = (unreadOnly: boolean) => {
    const authenticated = useAppSelector((state) => state.keycloak.authenticated)
    const viewerId = useViewerScopeId()

    const getKey = (
        index: number,
        previous: ReadonlyArray<NotificationItem> | null,
    ): MyNotificationsInfinitePageKey | null => {
        if (!authenticated || !viewerId) {
            return null
        }
        // previous page came back short → no more rows, stop
        if (previous && previous.length < NOTIFICATION_LIST_PAGE_LIMIT) {
            return null
        }
        return buildMyNotificationsInfiniteKey(unreadOnly, viewerId)(index)
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
