import useSWRInfinite from "swr/infinite"
import { FOLLOW_LIST_PAGE_LIMIT } from "./useQueryUserFollowersInfiniteSwr"
import { queryUserFollowing } from "@/modules/api/graphql/queries/query-user-following"
import type { QueryFollowerUser } from "@/modules/api/graphql/queries/types/user-followers"

/** Following rows per page — shared with the followers hook + modal. */
const PAGE_LIMIT = FOLLOW_LIST_PAGE_LIMIT

/**
 * Offset-paginated SWR hook for the users a profile follows (infinite scroll in
 * the follow-list modal). Mirrors {@link useQueryUserFollowersInfiniteSwr} on the
 * opposite edge. Re-keys on username. Public. Pass `enabled = false` to suspend
 * fetching while the tab is hidden.
 *
 * @param username - the username whose following to fetch.
 * @param enabled - when false, no request is made (key returns null).
 */
export const useQueryUserFollowingInfiniteSwr = (
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
        if (previous && previous.length < PAGE_LIMIT) {
            return null
        }
        return ["QUERY_USER_FOLLOWING_INFINITE_SWR", username, index * PAGE_LIMIT]
    }

    return useSWRInfinite(
        getKey,
        async ([, currentUsername, offset]) => {
            const data = await queryUserFollowing({
                request: {
                    username: currentUsername,
                    limit: PAGE_LIMIT,
                    offset,
                },
            })
            if (!data || !data.data) {
                throw new Error("Failed to fetch following")
            }
            return data.data.userFollowing?.data ?? []
        },
    )
}
