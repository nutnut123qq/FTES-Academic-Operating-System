"use client"

import React, { useCallback, useMemo, useState } from "react"
import { Button, Typography, toast } from "@heroui/react"
import { useLocale, useTranslations } from "next-intl"

import { useRequireAuth } from "@/hooks/useRequireAuth"
import { useAppSelector } from "@/redux/hooks"
import { PostCommentThread } from "@/components/reuseable/PostCommentThread"
import { formatRelativeTime } from "@/components/features/community/hooks/relativeTime"
import { useMutateCreateResourceCommentSwr } from "@/components/features/resource/hooks/useMutateCreateResourceCommentSwr"
import { useMutateDeleteResourceCommentSwr } from "@/components/features/resource/hooks/useMutateDeleteResourceCommentSwr"
import { useQueryResourceCommentsSwr } from "@/components/features/resource/hooks/useQueryResourceCommentsSwr"
import type { ResourceCommentView } from "@/modules/api/rest/resource"
import type { PostComment } from "@/components/features/community/hooks/useQueryPostDetailSwr"

/** Page size for the thread (mirrors the BE default). */
const COMMENTS_PAGE_SIZE = 20

/** Status the BE stamps on a soft-deleted (tombstoned) comment. */
const DELETED_STATUS = "DELETED"

/**
 * Adapts ONE BE comment onto the shared {@link PostComment} contract.
 *
 * Same degradation the FE-album thread documents: the C-4 comment view carries no author
 * card, only a `userId`, so `authorUsername` is that raw id and `PostCommentThread` prints
 * its shared "member" label rather than a uuid. A tombstone gets an EMPTY author id on
 * purpose — it must never match the viewer, so the ⋯ menu offers nothing on a comment that
 * is already deleted.
 *
 * @param comment - The BE row.
 * @param locale - Active locale, for the relative timestamp.
 * @returns The row in the shape every thread surface renders.
 */
const toPostComment = (comment: ResourceCommentView, locale: string): PostComment => {
    const isDeleted = comment.status === DELETED_STATUS || comment.userId === null
    return {
        id: comment.id,
        author: comment.userId ?? "",
        authorUsername: isDeleted ? "" : (comment.userId ?? ""),
        text: comment.content,
        timeLabel: formatRelativeTime(comment.createdAt, locale),
        replies: (comment.replies ?? []).map((reply) => toPostComment(reply, locale)),
    }
}

/** Props for {@link PePaperCommentThread}. */
export interface PePaperCommentThreadProps {
    /** The PE resource being discussed. */
    resourceId: string
}

/**
 * Discussion under a PE paper, rendered with the house {@link PostCommentThread}.
 *
 * PE has NO comment endpoint of its own — but it does not need one: the thread is the
 * RESOURCE-level C-4 Q&A (`GET/POST /api/v1/resources/{id}/comments`, `DELETE
 * /api/v1/resources/comments/{commentId}`), which is generic over every resource type and
 * already backs the same conversation on `/resources/{paperId}`. So this surfaces an
 * existing thread beside the paper instead of inventing a contract; a comment written here
 * is the same one the resource detail page shows.
 *
 * Two affordances are withheld, exactly as on the FE album thread:
 * - **edit** — the BE exposes no update endpoint for a resource comment;
 * - **report** — the thread's built-in report posts into the COMMUNITY module, where a
 *   resource comment id does not resolve, so the moderator would see a report that can
 *   never be actioned (`canReportComments={false}`).
 *
 * Hearts exist in the contract (`likeCount`/`likedByMe`) and are shown on the resource
 * detail page; they are not wired here because `PostCommentThread` has no like slot — the
 * same trade the FE album thread already makes.
 *
 * @param props - {@link PePaperCommentThreadProps}
 */
export const PePaperCommentThread = ({ resourceId }: PePaperCommentThreadProps) => {
    const t = useTranslations("subjects")
    const locale = useLocale()
    const viewerId = useAppSelector((state) => state.user.user?.id)
    const { requireAuth } = useRequireAuth()

    const [page, setPage] = useState(1)
    const commentsSwr = useQueryResourceCommentsSwr(resourceId, page)
    const create = useMutateCreateResourceCommentSwr()
    const remove = useMutateDeleteResourceCommentSwr()

    const total = commentsSwr.data?.total ?? 0
    const pageCount = Math.max(1, Math.ceil(total / COMMENTS_PAGE_SIZE))

    const comments = useMemo(
        () => (commentsSwr.data?.items ?? []).map((item) => toPostComment(item, locale)),
        [commentsSwr.data, locale],
    )

    const onSubmit = useCallback(
        async (body: string, parentCommentId?: string): Promise<boolean> => {
            if (!requireAuth("auth.context.comment")) {
                return false
            }
            try {
                await create.submit({
                    resourceId,
                    page,
                    request: { parentId: parentCommentId, content: body },
                    viewerId,
                })
                if (!parentCommentId) {
                    // A new root belongs on page 1 (the BE lists roots newest-first).
                    setPage(1)
                }
                return true
            } catch {
                toast.danger(t("practice.pe.comments.submitError"))
                return false
            }
        },
        [requireAuth, create, resourceId, page, viewerId, t],
    )

    const onDelete = useCallback(
        (commentId: string) => {
            void (async () => {
                try {
                    await remove.remove({ commentId, resourceId, page })
                } catch {
                    toast.danger(t("practice.pe.comments.deleteError"))
                }
            })()
        },
        [remove, resourceId, page, t],
    )

    return (
        <section className="flex flex-col gap-3">
            <Typography type="body-sm" weight="semibold">
                {t("practice.pe.comments.title", { count: total })}
            </Typography>

            <PostCommentThread
                regionId={`pe-paper-comments-${resourceId}`}
                comments={comments}
                isLoading={!commentsSwr.data && !commentsSwr.error}
                hasError={Boolean(!commentsSwr.data && commentsSwr.error)}
                error={commentsSwr.error}
                onRetry={() => {
                    void commentsSwr.mutate()
                }}
                onSubmit={onSubmit}
                onDeleteComment={onDelete}
                currentUserId={viewerId}
                canReportComments={false}
            />

            {pageCount > 1 ? (
                <div className="flex items-center justify-center gap-3">
                    <Button
                        size="sm"
                        variant="tertiary"
                        isDisabled={page <= 1 || commentsSwr.isValidating}
                        onPress={() => setPage((previous) => Math.max(1, previous - 1))}
                    >
                        {t("practice.pe.comments.prev")}
                    </Button>
                    <Typography type="body-xs" color="muted">
                        {t("practice.pe.comments.pageOf", { page, total: pageCount })}
                    </Typography>
                    <Button
                        size="sm"
                        variant="tertiary"
                        isDisabled={page >= pageCount || commentsSwr.isValidating}
                        onPress={() => setPage((previous) => Math.min(pageCount, previous + 1))}
                    >
                        {t("practice.pe.comments.next")}
                    </Button>
                </div>
            ) : null}
        </section>
    )
}
