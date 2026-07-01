import useSWRInfinite from "swr/infinite"
import { queryUserFeed } from "@/modules/api/graphql/queries/query-user-feed"
import type { QueryMyFeedResponseData } from "@/modules/api/graphql/queries/types/my-feed"

/** Items per timeline page. */
const PAGE_LIMIT = 20

/**
 * Cursor-paginated SWR hook for a single user's activity timeline (infinite
 * scroll). Public — works for anonymous viewers (no auth gate). Each page keys
 * off the previous page's `nextCursor`; returns a `null` key to stop when the
 * timeline is exhausted or no user id is provided. Re-keys on `userId` so
 * switching profile refetches from page 1.
 *
 * @param userId - id of the user whose timeline to read
 * @returns the SWRInfinite handle (data = array of pages, size, setSize, ...)
 */
export const useQueryUserFeedSwr = (userId: string | null | undefined) => {
    const getKey = (
        index: number,
        previous: QueryMyFeedResponseData | null,
    ): readonly [string, string, string] | null => {
        // nothing to fetch until we have a user id
        if (!userId) {
            return null
        }
        // previous page had no next cursor → end of timeline, stop
        if (previous && previous.nextCursor === null) {
            return null
        }
        // page 1 has no cursor; later pages use the previous page's nextCursor
        const cursor = index === 0 ? "" : previous?.nextCursor ?? ""
        return ["QUERY_USER_FEED_SWR", userId, cursor]
    }

    return useSWRInfinite(
        getKey,
        async ([, currentUserId, cursor]) => {
            const data = await queryUserFeed({
                request: {
                    userId: currentUserId,
                    cursor: cursor || undefined,
                    limit: PAGE_LIMIT,
                },
            })
            if (!data || !data.data) {
                throw new Error("Failed to fetch user activity")
            }
            return data.data.userFeed?.data ?? { items: [], nextCursor: null }
        },
    )
}
