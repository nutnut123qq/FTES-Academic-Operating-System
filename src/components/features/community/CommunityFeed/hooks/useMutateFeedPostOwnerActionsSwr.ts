"use client"

import { useCallback } from "react"
import { useSWRConfig } from "swr"
import {
    communityFeedCacheKeys,
    mutateCommunityFeeds,
    patchFeedPostInPages,
    type CommunityFeedPage,
    type CommunityPost,
} from "../../hooks/useQueryCommunityFeedSwr"
import {
    useMutatePostOwnerActionsSwr,
    type EditPostInput,
} from "../../CommunityPostDetail/hooks/useMutatePostOwnerActionsSwr"
import { splitBodyImages, unwrapAutolinks } from "../../CommunityPostDetail/postLinks"

/** Where a row sat before the optimistic removal, per feed cache key. */
interface RemovedRow {
    /** Index of the page the row was on. */
    pageIndex: number
    /** Index of the row inside that page. */
    itemIndex: number
    /** The removed row, kept verbatim so a rollback restores it as it was. */
    post: CommunityPost
}

/** Chars of the raw body mirrored into the row excerpt after an edit. */
const SNIPPET_LENGTH = 200

/**
 * Row excerpt shown until the next feed revalidate. The BE builds the real
 * `snippet` server-side, so this is deliberately a plain truncation — it only has
 * to stop the row from showing the PRE-edit text between a successful save and
 * the next fetch.
 *
 * The markdown is stripped exactly the way `toCommunityPost` strips the server snippet
 * (autolink brackets, embedded images, link syntax): the row prints this as PLAIN TEXT, so
 * mirroring the raw body would put `![Ảnh](https://…)` back on the row the moment its author
 * edits the post. Truncation happens AFTER the strip, so the 200 chars are visible text.
 * (The images themselves stay on whatever `media` the row already carries until the next
 * revalidate — same "good enough until the refetch" bargain as the text.)
 */
const toSnippet = (content: string): string => {
    const { text } = splitBodyImages(unwrapAutolinks(content))
    return text.length > SNIPPET_LENGTH ? `${text.slice(0, SNIPPET_LENGTH)}…` : text
}

/**
 * Feed-side wrapper around the shared post owner writes
 * ({@link useMutatePostOwnerActionsSwr}) — the REST calls, the auth guard, the
 * error→message mapping and the toasts all stay in that ONE hook; this one only
 * adds what a FEED row needs on top:
 *
 * - `deleteFeedPost` drops the row from every mounted feed cache BEFORE the write
 *   (the row vanishes on confirm, not a round-trip later) and puts it back when
 *   the write fails. The rollback re-inserts into the CURRENT pages read at revert
 *   time — never a stale snapshot — so pages loaded, likes or comments landing
 *   while the DELETE was in flight survive the undo. It also opts OUT of the
 *   shared hook's post-delete navigation: a feed row vanishes where it stands,
 *   so the viewer keeps their tab instead of being pushed to `/community`.
 * - `editFeedPost` mirrors the saved title/body onto the row after the server
 *   accepted it (the shared hook only patches the detail + metadata caches, which
 *   a feed row does not read), so the row does not keep showing the old text.
 */
export const useMutateFeedPostOwnerActionsSwr = () => {
    const { cache, mutate } = useSWRConfig()
    const { editPost, removePost } = useMutatePostOwnerActionsSwr()

    const deleteFeedPost = useCallback(
        async (postId: string): Promise<boolean> => {
            // remember where the row sat in EACH mounted feed cache, then drop it
            const removed = new Map<string, RemovedRow>()
            await Promise.all(
                communityFeedCacheKeys(cache).map((key) =>
                    mutate<Array<CommunityFeedPage>>(
                        key,
                        (pages) => {
                            if (!pages) {
                                return pages
                            }
                            pages.forEach((page, pageIndex) => {
                                const itemIndex = page.items.findIndex((item) => item.id === postId)
                                const post = page.items[itemIndex]
                                if (itemIndex >= 0 && post) {
                                    removed.set(key, { pageIndex, itemIndex, post })
                                }
                            })
                            return pages.map((page) => ({
                                ...page,
                                items: page.items.filter((item) => item.id !== postId),
                            }))
                        },
                        { revalidate: false },
                    ),
                ),
            )

            // the row is deleted IN PLACE — the shared hook must not pull the viewer
            // off the tab they are reading (/community/following, /community/campus …)
            const ok = await removePost(postId, { navigate: false })
            if (ok) {
                return true
            }

            // failed (or a guest was bounced to the auth modal) → put the row back,
            // patching the FRESH pages rather than restoring the captured snapshot
            await Promise.all(
                Array.from(removed.entries()).map(([key, row]) =>
                    mutate<Array<CommunityFeedPage>>(
                        key,
                        (pages) => {
                            if (!pages || pages.length === 0) {
                                return pages
                            }
                            // a concurrent refetch may have brought the row back already
                            if (pages.some((page) => page.items.some((item) => item.id === postId))) {
                                return pages
                            }
                            const pageIndex = Math.min(row.pageIndex, pages.length - 1)
                            return pages.map((page, index) => {
                                if (index !== pageIndex) {
                                    return page
                                }
                                const items = [...page.items]
                                items.splice(Math.min(row.itemIndex, items.length), 0, row.post)
                                return { ...page, items }
                            })
                        },
                        { revalidate: false },
                    ),
                ),
            )
            return false
        },
        [cache, mutate, removePost],
    )

    const editFeedPost = useCallback(
        async (postId: string, input: EditPostInput): Promise<boolean> => {
            const ok = await editPost(postId, input)
            if (!ok) {
                return false
            }
            await mutateCommunityFeeds(cache, mutate, (pages) =>
                patchFeedPostInPages(pages, postId, (post) => ({
                    ...post,
                    title: input.title ?? post.title,
                    snippet: toSnippet(input.content),
                })),
            )
            return true
        },
        [cache, editPost, mutate],
    )

    return { deleteFeedPost, editFeedPost }
}
