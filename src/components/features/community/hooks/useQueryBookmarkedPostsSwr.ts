"use client"

import { useCallback } from "react"
import useSWRInfinite from "swr/infinite"
import { useLocale } from "next-intl"
import { getBookmarkedPosts, unbookmarkPost } from "@/modules/api/rest/community/community"
import type { FeedPage, PostResponse } from "@/modules/api/rest/community/types"
import { useAppSelector } from "@/redux/hooks"
import { formatRelativeTime } from "./relativeTime"

/** A bookmarked post mapped to the saved-card contract. */
export interface SavedPost {
    id: string
    /** Author display name, or "" when the BE could not resolve the author card. */
    authorName: string
    /** URL-facing username for the profile link + hovercard (absent when unresolved). */
    authorUsername?: string
    /** Uploaded author avatar URL (absent when unresolved). */
    authorAvatarUrl?: string
    /** Stable seed for the generated fallback avatar (the author id). */
    seed: string
    timeLabel: string
    title: string
    snippet: string
    likes: number
    comments: number
}

/** Items per saved-page cursor page (BE `limit`, default 20). */
const PAGE_LIMIT = 20

/** Map a BE `PostResponse` to the saved-card contract. */
const toSavedPost = (post: PostResponse, locale: string): SavedPost => ({
    id: post.id,
    authorName: post.author?.displayName ?? post.author?.username ?? "",
    authorUsername: post.author?.username,
    authorAvatarUrl: post.author?.avatarUrl,
    seed: post.author?.userId ?? post.authorId,
    timeLabel: formatRelativeTime(post.createdAt, locale),
    title: post.title ?? "",
    snippet: post.content ?? "",
    likes: post.likeCount,
    comments: post.commentCount,
})

/**
 * Cursor-paginated SWR hook for the `/community/saved` page (infinite scroll),
 * backed by the real BE REST `GET /api/v1/community/bookmarks/posts?cursor=&limit=`.
 * Each page keys off the previous page's `nextCursor`; the key is `null` (no fetch)
 * when the viewer is unauthenticated or the previous page had no next cursor.
 * Auth-gated (the endpoint lists the CALLER's bookmarks).
 *
 * Returns the flattened post list plus `removePost`, an optimistic un-bookmark that
 * drops the card from every page immediately, fires the DELETE, and rolls the card
 * back (revalidate) on failure.
 */
export const useQueryBookmarkedPostsSwr = () => {
    const locale = useLocale()
    const authenticated = useAppSelector((state) => state.keycloak.authenticated)

    const getKey = (
        index: number,
        previous: FeedPage<PostResponse> | null,
    ): readonly [string, string] | null => {
        if (!authenticated) {
            return null
        }
        // previous page had no next cursor → end of list, stop
        if (previous && !previous.nextCursor) {
            return null
        }
        // page 1 has no cursor; later pages use the previous page's nextCursor
        const cursor = index === 0 ? "" : previous?.nextCursor ?? ""
        return ["QUERY_BOOKMARKED_POSTS_SWR", cursor]
    }

    const { data, error, isLoading, isValidating, size, setSize, mutate } = useSWRInfinite(
        getKey,
        async ([, cursor]) => getBookmarkedPosts(cursor || undefined, PAGE_LIMIT),
        { revalidateFirstPage: false },
    )

    const posts: Array<SavedPost> = (data ?? []).flatMap((page) =>
        page.items.map((item) => toSavedPost(item, locale)),
    )

    const lastPage = data?.[data.length - 1]
    const hasMore = Boolean(lastPage?.nextCursor)
    const isLoadingInitial = isLoading || (isValidating && (data?.length ?? 0) === 0)
    const isLoadingMore = isValidating && (data?.length ?? 0) > 0

    /** Optimistically remove a bookmarked post, then persist the un-bookmark. */
    const removePost = useCallback(
        async (postId: string) => {
            const drop = (pages: Array<FeedPage<PostResponse>> | undefined) =>
                (pages ?? []).map((page) => ({
                    ...page,
                    items: page.items.filter((item) => item.id !== postId),
                }))

            // optimistic drop across all loaded pages, no revalidation
            await mutate((current) => drop(current), { revalidate: false })
            try {
                await unbookmarkPost(postId)
            } catch (removeError) {
                // rollback: re-fetch to bring the card back
                await mutate()
                throw removeError
            }
        },
        [mutate],
    )

    return {
        posts,
        isLoading: isLoadingInitial,
        isLoadingMore,
        error,
        hasMore,
        size,
        setSize,
        mutate,
        removePost,
    }
}
