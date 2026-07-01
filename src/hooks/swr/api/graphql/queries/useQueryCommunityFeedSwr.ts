import useSWRInfinite from "swr/infinite"
import { queryCommunityFeed } from "@/modules/api/graphql/queries/query-community-feed"
import type { CommunityChannel, QueryCommunityFeedResponseData } from "@/modules/api/graphql/queries/types/community-feed"

/** Items per feed page. */
const PAGE_LIMIT = 10

/**
 * Cursor-paginated SWR hook for the community feed (infinite scroll). Open to
 * everyone — does NOT gate on auth (the feed is publicly readable; the viewer's
 * own reaction is just absent when signed out). Re-keys on `channel` so switching
 * the channel tab refetches from page 1. Pass `null` channel for the unfiltered
 * "all channels" feed.
 *
 * @param channel - channel to scope to, or null for all channels
 * @returns the SWRInfinite handle (data = array of pages, size, setSize, ...)
 */
export const useQueryCommunityFeedSwr = (channel: CommunityChannel | null) => {
    const getKey = (
        index: number,
        previous: QueryCommunityFeedResponseData | null,
    ): readonly [string, string, string] | null => {
        // previous page had no next cursor → end of feed, stop
        if (previous && previous.nextCursor === null) {
            return null
        }
        // page 1 has no cursor; later pages use the previous page's nextCursor
        const cursor = index === 0 ? "" : previous?.nextCursor ?? ""
        // encode null channel as "" so the key stays a stable string tuple
        return ["QUERY_COMMUNITY_FEED_SWR", channel ?? "", cursor]
    }

    return useSWRInfinite(
        getKey,
        async ([, currentChannel, cursor]) => {
            const data = await queryCommunityFeed({
                request: {
                    // restore null from the empty-string key segment
                    channel: (currentChannel || null) as CommunityChannel | null,
                    cursor: cursor || undefined,
                    limit: PAGE_LIMIT,
                },
            })
            if (!data || !data.data) {
                throw new Error("Failed to fetch community feed")
            }
            return data.data.communityFeed?.data ?? { items: [], nextCursor: null }
        },
    )
}
