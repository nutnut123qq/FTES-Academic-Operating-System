"use client"

import useSWR from "swr"
import { getTrending } from "@/modules/api/rest/community"
import type { PostResponse } from "@/modules/api/rest/community"

/** A trending post entry (mapped from the BE `PostResponse`). */
export interface TrendingPost {
    id: string
    title: string
    likes: number
}

/** How many trending rows to load (BE `trending?limit=`). */
const TRENDING_LIMIT = 10

/** Max chars for a title derived from post content (keeps the row single-line). */
const TITLE_FALLBACK_MAX = 80

/** Derive a single-line title: real title, else the first line of content, capped. */
const toTitle = (post: PostResponse): string => {
    if (post.title) {
        return post.title
    }
    const firstLine = (post.content ?? "").split("\n")[0]?.trim() ?? ""
    return firstLine.length > TITLE_FALLBACK_MAX
        ? `${firstLine.slice(0, TITLE_FALLBACK_MAX).trimEnd()}…`
        : firstLine
}

/**
 * Map a BE `PostResponse` to the ranked trending row.
 *
 * Note: `GET /community/trending` returns the raw `PostResponse` (no author
 * enrichment — unlike the GraphQL feed, which batch-resolves the author). Since
 * only the raw `authorId` UUID is available here, the author line is omitted
 * rather than surfacing an unreadable UUID; it can return once name enrichment
 * exists. `title` falls back to the first line of content for title-less kinds.
 */
const toTrendingPost = (post: PostResponse): TrendingPost => ({
    id: post.id,
    title: toTitle(post),
    likes: post.likeCount,
})

/**
 * Loads trending posts from the real BE `GET /api/v1/community/trending`
 * (GLOBAL scope). Requires auth (viewer-scoped); a guest / error surfaces via
 * `error` and the list renders its empty/error state.
 */
export const useQueryTrendingSwr = () => {
    const { data, isLoading, error, mutate } = useSWR<Array<TrendingPost>>(
        ["community-trending"],
        async () => {
            const posts = await getTrending({ scope: "GLOBAL", limit: TRENDING_LIMIT })
            return posts.map(toTrendingPost)
        },
    )
    return { trending: data ?? [], isLoading, error, mutate }
}
