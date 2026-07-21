"use client"

import { useCallback } from "react"
import { useSWRConfig } from "swr"
import { useTranslations } from "next-intl"
import { toast } from "@heroui/react"
import { useRequireAuth } from "@/hooks/useRequireAuth"
import { addComment } from "@/modules/api/rest/community"
import type { PostComment } from "@/components/features/community/hooks/useQueryPostDetailSwr"
import {
    subjectPostCommentsKey,
    type FeedScope,
    type SubjectPostThread,
} from "./useQuerySubjectPostCommentsSwr"

/** A comment/reply submitted from a subject discussion post. */
export interface SubmitSubjectCommentInput {
    postId: string
    body: string
    /** Author label for the optimistic node ("Bạn"/"You"). */
    authorLabel: string
    /** URL-facing username for the optimistic node's profile link. */
    authorUsername: string
    /** Localized "just now" label for the optimistic node. */
    justNowLabel: string
    /** When replying, the parent top-level comment id (one level only). */
    parentCommentId?: string
}

/**
 * Comments on a subject discussion post — the sibling of the community hub's
 * `useMutateCreatePostCommentSwr`, differing only in WHICH cache it patches: the discussion tab
 * reads its thread from `subjectPostCommentsKey(...)`, not from the post-detail cache.
 *
 * Discussion posts ARE community posts, so the write is the same REST endpoint. The comment is
 * appended optimistically, and a failed write restores the snapshot so a comment never appears to
 * be saved when it was not (the previous behaviour patched the cache and never called the API at
 * all, so comments vanished on reload).
 *
 * @returns `submit(input)` resolving `true` on success, `false` on failure or a blocked guest —
 * `false` tells the composer to keep the draft.
 */
export const useMutateCreateSubjectPostCommentSwr = (subjectId: string, scope: FeedScope) => {
    const t = useTranslations("communityHub")
    const { mutate } = useSWRConfig()
    const { requireAuth } = useRequireAuth()

    return useCallback(
        async (input: SubmitSubjectCommentInput): Promise<boolean> => {
            if (!requireAuth("auth.context.comment")) {
                return false
            }

            const key = subjectPostCommentsKey(subjectId, input.postId, scope)
            const optimistic: PostComment = {
                id: `tmp-${Date.now()}`,
                author: input.authorLabel,
                authorUsername: input.authorUsername,
                text: input.body,
                timeLabel: input.justNowLabel,
            }

            let snapshot: SubjectPostThread | undefined
            await mutate<SubjectPostThread>(
                key,
                (current) => {
                    snapshot = current
                    if (!current) {
                        return current
                    }
                    if (input.parentCommentId) {
                        return {
                            ...current,
                            comments: current.comments.map((comment) =>
                                comment.id === input.parentCommentId
                                    ? { ...comment, replies: [...(comment.replies ?? []), optimistic] }
                                    : comment,
                            ),
                        }
                    }
                    return { ...current, comments: [...current.comments, optimistic] }
                },
                { revalidate: false },
            )

            try {
                await addComment(input.postId, {
                    body: input.body,
                    parentId: input.parentCommentId,
                })
            } catch {
                await mutate(key, snapshot, { revalidate: false })
                toast.danger(t("engagement.commentFailed"))
                return false
            }

            // Replace the optimistic node with the server's (real id + ordering). A refetch error
            // after a SUCCESSFUL write must not be reported as a failed comment.
            await mutate(key).catch(() => {})
            return true
        },
        [subjectId, scope, mutate, requireAuth, t],
    )
}
