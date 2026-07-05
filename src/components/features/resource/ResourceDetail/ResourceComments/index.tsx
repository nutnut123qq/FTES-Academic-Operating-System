"use client"

import React, { useCallback, useMemo, useState } from "react"
import { Skeleton, Typography } from "@heroui/react"
import { useTranslations } from "next-intl"
import { useParams } from "next/navigation"

import { useAppSelector } from "@/redux/hooks"
import { useRequireAuth } from "@/hooks/useRequireAuth"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import { Link } from "@/i18n/navigation"
import type { ResourceCommentItem } from "../../hooks/resource-comments-mock"
import { useQueryResourceCommentsSwr } from "../../hooks/useQueryResourceCommentsSwr"
import { useMutateCreateResourceCommentSwr } from "../../hooks/useMutateCreateResourceCommentSwr"
import { useMutateDeleteResourceCommentSwr } from "../../hooks/useMutateDeleteResourceCommentSwr"
import { useMutateToggleResourceCommentLikeSwr } from "../../hooks/useMutateToggleResourceCommentLikeSwr"
import { CommentComposer } from "./CommentComposer"
import { CommentItem } from "./CommentItem"

/** Skeleton mirroring the comment list layout (avatar circle + two text lines). */
const ResourceCommentsSkeleton = () => (
    <div className="flex flex-col gap-4">
        {[0, 1, 2].map((row) => (
            <div key={row} className="flex items-start gap-3">
                <Skeleton className="size-8 shrink-0 rounded-full" />
                <div className="flex min-w-0 flex-1 flex-col gap-2">
                    <Skeleton className="h-3 w-40 rounded-full" />
                    <Skeleton className="h-3 w-full rounded-full" />
                </div>
            </div>
        ))}
    </div>
)

/**
 * Threads-style comments on the resource detail page (§5): minimal borderless
 * rows, flat one-level replies, per-comment like, optimistic append/remove
 * with rollback, delete-own with confirm, guest gating into the auth modal,
 * and full loading/empty/error states. Free-form discussion only — rating
 * lives on `/resources/[resourceId]/reviews` (cross-linked in the header).
 * The main composer sticks to the bottom of the viewport on `<sm` and renders
 * inline at the top of the thread from `sm:` up.
 */
export const ResourceComments = () => {
    const t = useTranslations()
    const { resourceId } = useParams<{ resourceId: string }>()
    const user = useAppSelector((state) => state.user.user)
    const { requireAuth: requireAuthBase } = useRequireAuth()

    const commentsSwr = useQueryResourceCommentsSwr(resourceId)
    const { createComment, isMutating: isCreating } = useMutateCreateResourceCommentSwr(resourceId)
    const { deleteComment } = useMutateDeleteResourceCommentSwr(resourceId)
    const { toggleLike } = useMutateToggleResourceCommentLikeSwr(resourceId)

    // top-level comment id whose inline reply composer is open (replies retarget here)
    const [replyTargetId, setReplyTargetId] = useState<string | null>(null)

    /** Gate an interaction on auth: guests get the sign-in modal (with the comment
     * context message, via the shared `useRequireAuth` guard), no action runs. */
    const requireAuth = useCallback(
        () => requireAuthBase("auth.context.comment") && Boolean(user),
        [requireAuthBase, user],
    )

    const comments = commentsSwr.comments ?? []

    // top-level newest-first; replies oldest-first within their parent
    const { topLevel, repliesByParent } = useMemo(() => {
        const top = comments
            .filter((comment) => comment.parentId === null)
            .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        const byParent: Record<string, Array<ResourceCommentItem>> = {}
        for (const comment of comments) {
            if (comment.parentId !== null) {
                byParent[comment.parentId] = [...(byParent[comment.parentId] ?? []), comment]
            }
        }
        for (const parentId of Object.keys(byParent)) {
            byParent[parentId].sort((a, b) => a.createdAt.localeCompare(b.createdAt))
        }
        return { topLevel: top, repliesByParent: byParent }
    }, [comments])

    /** Create a comment/reply as the current user; false on failure (draft kept). */
    const submitComment = useCallback(
        async (text: string, parentId: string | null) => {
            if (!requireAuth() || !user) {
                return false
            }
            try {
                await createComment({
                    text,
                    parentId,
                    author: {
                        id: user.id,
                        username: user.username,
                        name: user.displayName ?? user.username,
                        avatarUrl: user.avatar,
                    },
                })
                if (parentId !== null) {
                    setReplyTargetId(null)
                }
                return true
            } catch {
                // optimistic item already rolled back — composer keeps the draft
                return false
            }
        },
        [requireAuth, user, createComment],
    )

    const handleToggleLike = useCallback(
        (comment: ResourceCommentItem) => {
            if (!requireAuthBase("auth.context.like")) {
                return
            }
            void toggleLike(comment.id)
        },
        [requireAuthBase, toggleLike],
    )

    /** Open the reply composer; replying to a reply retargets its top-level parent. */
    const handleRequestReply = useCallback(
        (comment: ResourceCommentItem) => {
            if (!requireAuth()) {
                return
            }
            setReplyTargetId(comment.parentId ?? comment.id)
        },
        [requireAuth],
    )

    const handleDelete = useCallback(
        async (comment: ResourceCommentItem) => {
            try {
                await deleteComment(comment.id)
                return true
            } catch {
                // optimistic removal already rolled back — the row reappears
                return false
            }
        },
        [deleteComment],
    )

    return (
        // pb reserves space for the `<sm` fixed composer bar so the last row is never covered
        <section className="flex flex-col gap-3 border-t border-separator pb-20 pt-6 sm:pb-0">
            {/* header: title + count, cross-link to the reviews page (no star input here) */}
            <div className="flex flex-wrap items-center justify-between gap-2">
                <Typography type="h6" weight="bold">
                    {t("resourceHub.comments.title", { count: comments.length })}
                </Typography>
                <Link
                    href={`/resources/${resourceId}/reviews`}
                    className="text-xs text-accent hover:underline"
                >
                    {t("resourceHub.comments.goToReviews")}
                </Link>
            </div>

            {/* main composer: fixed bottom bar on <sm, inline at the top of the thread from sm: */}
            <div className="fixed inset-x-0 bottom-0 z-30 border-t border-separator bg-surface p-3 sm:static sm:z-auto sm:border-0 sm:bg-transparent sm:p-0">
                <CommentComposer
                    placeholder={t("resourceHub.comments.placeholder")}
                    submitLabel={t("resourceHub.comments.submit")}
                    onSubmit={(text) => submitComment(text, null)}
                    onRequireAuth={requireAuth}
                    isSubmitting={isCreating && replyTargetId === null}
                />
            </div>

            <AsyncContent
                isLoading={!commentsSwr.comments && !commentsSwr.error}
                skeleton={<ResourceCommentsSkeleton />}
                isEmpty={comments.length === 0}
                emptyContent={{ title: t("resourceHub.comments.empty") }}
                error={!commentsSwr.comments ? commentsSwr.error : undefined}
                errorContent={{
                    title: t("resourceHub.comments.loadError"),
                    onRetry: () => {
                        void commentsSwr.mutate()
                    },
                    retryLabel: t("resourceHub.comments.retry"),
                }}
            >
                <div className="flex flex-col gap-4">
                    {topLevel.map((comment) => (
                        <CommentItem
                            key={comment.id}
                            comment={comment}
                            replies={repliesByParent[comment.id] ?? []}
                            currentUserId={user?.id ?? null}
                            isReplyComposerOpen={replyTargetId === comment.id}
                            isSubmittingReply={isCreating && replyTargetId === comment.id}
                            onToggleLike={handleToggleLike}
                            onRequestReply={handleRequestReply}
                            onCancelReply={() => setReplyTargetId(null)}
                            onSubmitReply={(text) => submitComment(text, comment.id)}
                            onRequireAuth={requireAuth}
                            onDelete={handleDelete}
                        />
                    ))}
                </div>
            </AsyncContent>
        </section>
    )
}
