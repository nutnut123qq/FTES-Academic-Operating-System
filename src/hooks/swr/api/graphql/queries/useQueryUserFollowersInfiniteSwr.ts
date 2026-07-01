import useSWRInfinite from "swr/infinite"
import { queryUserFollowers } from "@/modules/api/graphql/queries/query-user-followers"
import type { QueryFollowerUser } from "@/modules/api/graphql/queries/types/user-followers"

/** Followers/following per page (the server clamps its own cap independently). Shared with the following hook + the follow-list modal so `hasMore` derives off one number. */
export const FOLLOW_LIST_PAGE_LIMIT = 20
/** @deprecated internal alias — use {@link FOLLOW_LIST_PAGE_LIMIT}. */
const PAGE_LIMIT = FOLLOW_LIST_PAGE_LIMIT

/**
 * Offset-paginated SWR hook for a profile's followers (infinite scroll in the
 * follow-list modal). Each page skips `index * PAGE_LIMIT`; a page shorter than
 * the limit ends the list. Re-keys on username. Public (no auth gate). Pass
 * `enabled = false` (e.g. while the modal/tab is hidden) to suspend fetching.
 *
 * @param username - the username whose followers to fetch.
 * @param enabled - when false, no request is made (key returns null).
 */
export const useQueryUserFollowersInfiniteSwr = (
    username: string | null | undefined,
    enabled = true,
) => {
    const getKey = (
        index: number,
        previous: ReadonlyArray<QueryFollowerUser> | null,
    ): readonly [string, string, number] | null => {
        if (!enabled || !username) {
            return null
        }
        // previous page came back short → no more rows, stop
        if (previous && previous.length < PAGE_LIMIT) {
            return null
        }
        return ["QUERY_USER_FOLLOWERS_INFINITE_SWR", username, index * PAGE_LIMIT]
    }

    return useSWRInfinite(
        getKey,
        async ([, currentUsername, offset]) => {
            const data = await queryUserFollowers({
                request: {
                    username: currentUsername,
                    limit: PAGE_LIMIT,
                    offset,
                },
            })
            if (!data || !data.data) {
                throw new Error("Failed to fetch followers")
            }
            return data.data.userFollowers?.data ?? []
        },
    )
}
