"use client"

import { useLocale } from "next-intl"
import useSWR from "swr"
import {
    createGroupThreadComment,
    listGroupThreadComments,
    type GroupThreadCommentDto,
} from "@/modules/api/rest/group"
import type { PostComment } from "@/components/features/community/hooks/useQueryPostDetailSwr"
import { formatRelativeTime } from "@/components/features/community/hooks/relativeTime"

/** Comment thread for a group discussion thread (change group-social-engagement §2.2). */
export interface GroupThreadComments {
    /** The discussion thread id. */
    id: string
    /** Nested one-level comment list. */
    comments: Array<PostComment>
}

/** SWR cache key for a group discussion thread's comments. */
export const groupThreadCommentsKey = (groupId: string, threadId: string) => [
    "group-thread-comments",
    groupId,
    threadId,
]

/**
 * Builds the nested one-level `PostComment` tree from the flat BE thread-comment
 * list. Comments carry only `authorId` (no profile join) → author display falls
 * back to the id. Replies (depth ≥ 1) attach to their root via `rootId`/`parentId`.
 */
const buildThreadCommentTree = (
    items: Array<GroupThreadCommentDto>,
    locale: string,
): Array<PostComment> => {
    const toComment = (dto: GroupThreadCommentDto): PostComment => ({
        id: dto.id,
        author: dto.authorId,
        authorUsername: dto.authorId,
        text: dto.content,
        timeLabel: dto.createdAt ? formatRelativeTime(dto.createdAt, locale) : "",
    })

    const roots: Array<PostComment> = []
    const byId = new Map<string, PostComment>()
    for (const dto of items) {
        if (dto.depth === 0 || !dto.parentId) {
            const node: PostComment = { ...toComment(dto), replies: [] }
            byId.set(dto.id, node)
            roots.push(node)
        }
    }
    for (const dto of items) {
        if (dto.depth === 0 || !dto.parentId) {
            continue
        }
        const rootId = dto.rootId ?? dto.parentId
        const root = rootId ? byId.get(rootId) : undefined
        if (root) {
            root.replies = [...(root.replies ?? []), toComment(dto)]
        } else {
            roots.push(toComment(dto))
        }
    }
    return roots
}

/**
 * Lazily loads a group discussion thread's comments (only once expanded) from the
 * real REST endpoint.
 *
 * @param groupId - the owning group id.
 * @param threadId - the discussion thread whose comments to load.
 * @param enabled - true once the thread has been expanded at least once.
 */
export const useQueryGroupThreadCommentsSwr = (
    groupId: string,
    threadId: string,
    enabled: boolean,
) => {
    const locale = useLocale()
    const { data, isLoading, error, mutate } = useSWR(
        enabled ? [...groupThreadCommentsKey(groupId, threadId), locale] : null,
        async (): Promise<GroupThreadComments> => {
            const page = await listGroupThreadComments(groupId, threadId, { limit: 50 })
            return { id: threadId, comments: buildThreadCommentTree(page.items ?? [], locale) }
        },
    )
    return { thread: data, isLoading, error, mutate }
}

/**
 * Composes a comment (or one-level reply) on a discussion thread via the real REST
 * endpoint, then revalidates the comment cache.
 *
 * @returns a submit fn compatible with `PostCommentThread.onSubmit`.
 */
export const useComposeGroupThreadComment = (
    groupId: string,
    threadId: string,
    mutate: () => Promise<unknown>,
) =>
    async (body: string, parentCommentId?: string): Promise<boolean> => {
        try {
            await createGroupThreadComment(groupId, threadId, {
                content: body,
                parentId: parentCommentId,
            })
            await mutate()
            return true
        } catch {
            return false
        }
    }
