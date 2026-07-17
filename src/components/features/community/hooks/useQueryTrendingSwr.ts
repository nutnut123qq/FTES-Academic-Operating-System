"use client"

import useSWR from "swr"
import { getTrending } from "@/modules/api/rest/community"
import type { PostResponse } from "@/modules/api/rest/community"

/** A trending post entry (mapped from the BE `PostResponse`). */
export interface TrendingPost {
    id: string
    title: string
    likes: number
    /** Author display name, or `undefined` when the BE could not resolve the author card. */
    authorName?: string
    /** URL-facing username of the author (absent when unresolved). */
    authorUsername?: string
    /** Uploaded author avatar URL (absent when unresolved). */
    authorAvatarUrl?: string
    /** Stable seed for the generated fallback avatar (the author id). */
    authorSeed: string
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
 * `GET /community/trending` batch-resolves the author card onto each
 * `PostResponse.author` (one profile call for the whole page, no N+1); the row
 * surfaces the display name + avatar when present. When the author card is
 * unresolved (`author == null`) the name/avatar are omitted and the component
 * drops the author line rather than showing a raw UUID. `title` falls back to
 * the first line of content for title-less kinds.
 */
const toTrendingPost = (post: PostResponse): TrendingPost => ({
    id: post.id,
    title: toTitle(post),
    likes: post.likeCount,
    authorName: post.author?.displayName ?? post.author?.username ?? undefined,
    authorUsername: post.author?.username,
    authorAvatarUrl: post.author?.avatarUrl,
    authorSeed: post.author?.userId ?? post.authorId,
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
