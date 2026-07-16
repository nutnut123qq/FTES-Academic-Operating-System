"use client"

import { useLocale } from "next-intl"
import useSWR from "swr"
import { addComment, getPostComments } from "@/modules/api/rest/community"
import type { PostComment } from "@/components/features/community/hooks/useQueryPostDetailSwr"
import { buildCommentTree } from "./groupComments"

/**
 * Comment thread for a group post. A group post IS a community post, so comments
 * are read from the real community endpoint (`GET /community/posts/{postId}/comments`)
 * and composed with `POST /community/posts/{postId}/comments` — change
 * group-social-engagement §5.2. Shaped like the community post-comment thread so
 * `PostCommentThread` consumes it uniformly.
 */
export interface GroupPostThread {
    /** The group post id. */
    id: string
    /** Nested one-level comment list. */
    comments: Array<PostComment>
}

/** SWR cache key for a group post's comment thread. */
export const groupPostCommentsKey = (groupId: string, postId: string) => [
    "group-post-comments",
    groupId,
    postId,
]

/**
 * Lazily loads a group post's comment thread (only once expanded). Reads the real
 * community comments endpoint and maps the flat BE list into the nested
 * `PostComment` tree.
 *
 * @param groupId - the owning group id (cache scoping only).
 * @param postId - the group post whose comments to load.
 * @param enabled - true once the post has been expanded at least once.
 */
export const useQueryGroupPostCommentsSwr = (
    groupId: string,
    postId: string,
    enabled: boolean,
) => {
    const locale = useLocale()
    const { data, isLoading, error, mutate } = useSWR(
        enabled ? [...groupPostCommentsKey(groupId, postId), locale] : null,
        async (): Promise<GroupPostThread> => {
            const page = await getPostComments(postId, { limit: 50 })
            return { id: postId, comments: buildCommentTree(page.items ?? [], locale) }
        },
    )
    return { thread: data, isLoading, error, mutate }
}

/**
 * Composes a comment (or one-level reply) on a group post via the community
 * comment endpoint, then revalidates the thread cache to pull server truth.
 *
 * @returns a submit fn compatible with `PostCommentThread.onSubmit`.
 */
export const useComposeGroupPostComment = (
    groupId: string,
    postId: string,
    mutate: () => Promise<unknown>,
) =>
    async (body: string, parentCommentId?: string): Promise<boolean> => {
        try {
            await addComment(postId, { body, parentId: parentCommentId })
            await mutate()
            return true
        } catch {
            return false
        }
    }
