"use client"

import useSWR from "swr"
import { useLocale } from "next-intl"
import {
    FeedTab,
    queryCommunityFeed,
    type FeedPost,
} from "@/modules/api/graphql/queries/query-community-feed"
import { formatRelativeTime } from "./relativeTime"

/** A community post (BE `Post` mapped to the feed card contract). */
export interface CommunityPost {
    id: string
    author: string
    /** URL-facing username for the profile link + hovercard. */
    authorUsername: string
    timeLabel: string
    title: string
    snippet: string
    likes: number
    /** Whether the current user has liked this post (drives optimistic toggle). */
    liked: boolean
    comments: number
}

/** Feed scope selectable by the shell tabs. CAMPUS is unsupported by the BE `feed` (needs a campus arg). */
export type CommunityFeedTab = "forYou" | "following" | "trending"

/** SWR cache key for the DEFAULT (For You) community feed — shared with the like/comment mutations. */
export const COMMUNITY_FEED_KEY = ["community-feed"]

/** Map the shell tab to the BE `FeedTab` enum literal (inlined into the query, not a variable). */
const toFeedTab = (tab: CommunityFeedTab): FeedTab => {
    switch (tab) {
        case "following":
            return FeedTab.Following
        case "trending":
            return FeedTab.Trending
        case "forYou":
        default:
            return FeedTab.ForYou
    }
}

/**
 * Map a BE `Post` to the feed card contract. The gateway now enriches every feed row
 * with `snippet`, `likeCount`, `likedByMe` and `commentCount`, so the card renders the
 * real excerpt and engagement instead of the previous "" / 0 / false placeholders.
 */
const toCommunityPost = (post: FeedPost, locale: string): CommunityPost => ({
    id: post.id,
    author: post.author.displayName ?? post.author.username ?? "",
    authorUsername: post.author.username ?? post.author.id,
    timeLabel: formatRelativeTime(post.createdAt, locale),
    title: post.title ?? "",
    snippet: post.snippet ?? "",
    likes: post.likeCount,
    liked: post.likedByMe,
    comments: post.commentCount,
})

/** Items per feed page (BE `CursorInput.limit`). */
const PAGE_LIMIT = 20

/**
 * Loads the community feed for a scope from the real BE GraphQL `feed(tab, page)`.
 * Requires auth (viewer-scoped visibility); a guest / error surfaces via `error`
 * and the feed renders its empty/error state. Keyed on the tab so switching tabs
 * refetches; the default (For You) uses `COMMUNITY_FEED_KEY` so the optimistic
 * like/comment mutations keep patching the right cache.
 */
export const useQueryCommunityFeedSwr = (tab: CommunityFeedTab = "forYou") => {
    const locale = useLocale()
    const key = tab === "forYou" ? COMMUNITY_FEED_KEY : [...COMMUNITY_FEED_KEY, tab]

    const { data, isLoading, error, mutate } = useSWR<Array<CommunityPost>>(
        key,
        async () => {
            const result = await queryCommunityFeed({
                tab: toFeedTab(tab),
                page: { limit: PAGE_LIMIT },
            })
            const connection = result.data?.feed
            return (connection?.items ?? []).map((item) => toCommunityPost(item, locale))
        },
    )

    return { posts: data ?? [], isLoading, error, mutate }
}
