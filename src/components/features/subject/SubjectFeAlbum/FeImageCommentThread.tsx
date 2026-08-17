"use client"

import React, { useCallback, useMemo, useState } from "react"
import { Button, Typography, toast } from "@heroui/react"
import { useLocale, useTranslations } from "next-intl"

import { useRequireAuth } from "@/hooks/useRequireAuth"
import { useAppSelector } from "@/redux/hooks"
import {
    PostCommentThread,
    type CommentThreadLabels,
} from "@/components/reuseable/PostCommentThread"
import { formatRelativeTime } from "@/components/features/community/hooks/relativeTime"
import { FE_IMAGE_COMMENT_DELETED } from "@/components/features/resource/hooks/feImageCommentTree"
import { useMutateCreateFeImageCommentSwr } from "@/components/features/resource/hooks/useMutateCreateFeImageCommentSwr"
import { useMutateDeleteFeImageCommentSwr } from "@/components/features/resource/hooks/useMutateDeleteFeImageCommentSwr"
import { useQueryFeImageCommentsSwr } from "@/components/features/resource/hooks/useQueryFeImageCommentsSwr"
import type { FeImageCommentView } from "@/modules/api/rest/resource"
import type { PostComment } from "@/components/features/community/hooks/useQueryPostDetailSwr"

/** Page size for one image's comment thread (mirrors the BE default). */
const COMMENTS_PAGE_SIZE = 20

/**
 * Adapts ONE BE comment onto the shared {@link PostComment} contract.
 *
 * The FE-image comment view carries NO author card — only a `userId` — so nothing about
 * the author is invented here: `authorUsername` is set to that raw id, which is exactly
 * the degradation `PostCommentThread` documents (its owner gate compares the viewer id
 * too, and its row prints the shared "member" label instead of a uuid). A tombstoned row
 * gets an EMPTY author id on purpose: it must never match the viewer, so the ⋯ menu
 * offers nothing on a comment that is already deleted.
 *
 * @param comment - The BE row.
 * @param locale - Active locale, for the relative timestamp.
 * @returns The row in the shape every thread surface renders.
 */
const toPostComment = (comment: FeImageCommentView, locale: string): PostComment => {
    const isDeleted = comment.status === FE_IMAGE_COMMENT_DELETED || comment.userId === null
    return {
        id: comment.id,
        author: comment.userId ?? "",
        authorUsername: isDeleted ? "" : (comment.userId ?? ""),
        text: comment.content,
        timeLabel: formatRelativeTime(comment.createdAt, locale),
        replies: (comment.replies ?? []).map((reply) => toPostComment(reply, locale)),
    }
}

/** Props for {@link FeImageCommentThread}. */
export interface FeImageCommentThreadProps {
    /** The FE resource holding the album. */
    resourceId: string
    /** The album image whose thread this is. */
    imageId: string
}

/**
 * The comment thread of ONE FE album picture, rendered with the house
 * {@link PostCommentThread} (one-level replies, rich composer, ⋯ row menu) fed through a
 * thin adapter over `GET/POST /resources/{id}/images/{imageId}/comments`.
 *
 * Two affordances are deliberately withheld:
 * - **edit** — the BE exposes no update endpoint for an image comment, so offering
 *   "Sửa" would be a dead button;
 * - **report** — the thread's built-in report posts `targetType: "COMMENT"` into the
 *   COMMUNITY module, and an FE-image comment id does not resolve there; a report would
 *   look handled to the moderator while the comment stayed up (`canReportComments={false}`,
 *   exactly the escape hatch the thread documents for non-community surfaces).
 *
 * Deletion is soft server-side: the row survives with the BE's tombstone body and its
 * replies intact, and the optimistic patch mirrors that instead of removing the node.
 *
 * The component is mounted with the image id as its React `key`, so paging the album
 * resets the page counter and reply state without an effect.
 *
 * @param props - {@link FeImageCommentThreadProps}
 */
export const FeImageCommentThread = ({
    resourceId,
    imageId,
}: FeImageCommentThreadProps) => {
    const t = useTranslations("subjects")
    const locale = useLocale()
    const viewerId = useAppSelector((state) => state.user.user?.id)
    const { requireAuth } = useRequireAuth()

    const [page, setPage] = useState(1)
    const commentsSwr = useQueryFeImageCommentsSwr(resourceId, imageId, page)
    const create = useMutateCreateFeImageCommentSwr()
    const remove = useMutateDeleteFeImageCommentSwr()

    const total = commentsSwr.data?.total ?? 0
    const pageCount = Math.max(1, Math.ceil(total / COMMENTS_PAGE_SIZE))

    const comments = useMemo(
        () => (commentsSwr.data?.items ?? []).map((item) => toPostComment(item, locale)),
        [commentsSwr.data, locale],
    )

    /**
     * Picture-flavoured copy for the states that NAME the thing being discussed —
     * the same leak the challenge paper had: the shared thread's defaults are
     * written for a community post, so a failed read here announced that "this
     * post no longer exists or was removed" about an image the reader is looking
     * at. Only the object-naming lines are overridden; the network / server /
     * "sign in" / "try again" lines read identically everywhere and stay shared.
     */
    const labels = useMemo<CommentThreadLabels>(
        () => ({
            empty: t("practice.fe.comments.empty"),
            loadFailed: t("practice.fe.comments.loadFailed"),
            loadFailedAuth: t("practice.fe.comments.loadFailedAuth"),
            loadFailedForbidden: t("practice.fe.comments.loadFailedForbidden"),
            loadFailedGone: t("practice.fe.comments.loadFailedGone"),
            loadFailedUnavailable: t("practice.fe.comments.loadFailedUnavailable"),
        }),
        [t],
    )

    const onSubmit = useCallback(
        async (body: string, parentCommentId?: string): Promise<boolean> => {
            if (!requireAuth("auth.context.comment")) {
                return false
            }
            try {
                await create.submit({
                    resourceId,
                    imageId,
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
                toast.danger(t("practice.fe.comments.submitError"))
                return false
            }
        },
        [requireAuth, create, resourceId, imageId, page, viewerId, t],
    )

    const onDelete = useCallback(
        (commentId: string) => {
            void (async () => {
                try {
                    await remove.remove({ commentId, resourceId, imageId, page })
                } catch {
                    toast.danger(t("practice.fe.comments.deleteError"))
                }
            })()
        },
        [remove, resourceId, imageId, page, t],
    )

    return (
        // ponytail: chat anatomy with no new component — the thread FILLS the column
        // (`min-h-0 flex-1`), and the scroll split (comment list scrolls, composer pinned
        // to the bottom edge) now lives INSIDE `PostCommentThread` itself, so the
        // `[&>*:first-child]:…` rules that used to reach into its children from out here
        // are gone.
        <div className="flex min-h-0 flex-1 flex-col gap-3">
            {/* Header strip: the count, and the pager BESIDE it rather than under the
                thread — anything below the composer would unpin it from the bottom. */}
            <div className="flex shrink-0 items-center justify-between gap-2">
                <Typography type="body-sm" weight="semibold">
                    {t("practice.fe.comments.title", { count: total })}
                </Typography>
                {pageCount > 1 ? (
                    <div className="flex items-center gap-1">
                        <Button
                            size="sm"
                            variant="tertiary"
                            isDisabled={page <= 1 || commentsSwr.isValidating}
                            onPress={() => setPage((prev) => Math.max(1, prev - 1))}
                        >
                            {t("practice.fe.comments.prev")}
                        </Button>
                        <Typography type="body-xs" color="muted">
                            {t("practice.fe.comments.pageOf", { page, total: pageCount })}
                        </Typography>
                        <Button
                            size="sm"
                            variant="tertiary"
                            isDisabled={page >= pageCount || commentsSwr.isValidating}
                            onPress={() => setPage((prev) => Math.min(pageCount, prev + 1))}
                        >
                            {t("practice.fe.comments.next")}
                        </Button>
                    </div>
                ) : null}
            </div>

            <PostCommentThread
                className="min-h-0 flex-1"
                regionId={`fe-image-comments-${imageId}`}
                comments={comments}
                isLoading={!commentsSwr.data && !commentsSwr.error}
                hasError={Boolean(!commentsSwr.data && commentsSwr.error)}
                error={commentsSwr.error}
                onRetry={() => {
                    void commentsSwr.mutate()
                }}
                labels={labels}
                onSubmit={onSubmit}
                onDeleteComment={onDelete}
                currentUserId={viewerId}
                canReportComments={false}
            />
        </div>
    )
}
