"use client"

import useSWR from "swr"
import {
    splitBodyImages,
    unwrapAutolinks,
} from "@/components/features/community/CommunityPostDetail/postLinks"
import { getTrending, type PostResponse } from "@/modules/api/rest/community"
import { useAppSelector } from "@/redux/hooks"

/** One trending community post, mapped for the compact dashboard row. */
export interface ExploreTrendingItem {
    /** Post id — the row navigates to `/community/{id}`. */
    id: string
    /** Line 1: the post title, or a plain-text excerpt of its body when untitled. */
    title: string
    /**
     * Line 2: the author's display name / username, or `""` when the backend left the
     * profile card unresolved. NEVER the author id — a uuid is not a name.
     */
    author: string
    /** Real engagement counters carried by the post row. */
    likes: number
    /** Real engagement counters carried by the post row. */
    comments: number
}

/** Rows shown in the dashboard trending card (the full list lives at `/community/trending`). */
export const EXPLORE_TRENDING_LIMIT = 5

/** Longest excerpt used when a post carries no title. */
const EXCERPT_LENGTH = 120

/**
 * Post body as plain text, capped. Composer markdown is removed before the compact
 * row receives it, matching the main feed's snippet mapping.
 */
const toExcerpt = (content: string | undefined): string => {
    const flat = splitBodyImages(unwrapAutolinks(content ?? "")).text
    return flat.length > EXCERPT_LENGTH ? `${flat.slice(0, EXCERPT_LENGTH)}…` : flat
}

/** Map one BE `PostResponse` onto the row contract. */
const toTrendingItem = (post: PostResponse): ExploreTrendingItem => ({
    id: post.id,
    title: post.title?.trim() || toExcerpt(post.content),
    author: post.author?.displayName ?? post.author?.username ?? "",
    likes: post.likeCount,
    comments: post.commentCount,
})

/**
 * Loads the platform trending posts for the dashboard EXPLORE tab from the real
 * `GET /community/trending` (scope GLOBAL), capped at {@link EXPLORE_TRENDING_LIMIT}.
 *
 * Auth-gated: the endpoint is caller-scoped and 401s for guests, so a guest keys to
 * `null` and never fires it (the shared `useGetCommunityTrendingSwr` wrapper does NOT
 * gate, which is why this adapter calls the REST function directly).
 *
 * Trending is an ORDER, not a score: the backend ranks the ids in Redis and never
 * serialises the score, so the row shows its list position plus the post's real
 * like/comment counts — never a "trend %" or heat metric. An empty list is a normal
 * state (the ranking job refreshes every 15 minutes and starts out empty), not an error.
 */
export const useQueryExploreTrendingSwr = () => {
    const authenticated = useAppSelector((state) => state.keycloak.authenticated)
    const { data, isLoading, error, mutate } = useSWR(
        authenticated ? ["dashboard", "explore", "trending", EXPLORE_TRENDING_LIMIT] : null,
        async (): Promise<Array<ExploreTrendingItem>> => {
            const posts = await getTrending({ limit: EXPLORE_TRENDING_LIMIT })
            return posts.map(toTrendingItem)
        },
    )

    return {
        items: data ?? [],
        isLoading,
        error,
        mutate,
    }
}
