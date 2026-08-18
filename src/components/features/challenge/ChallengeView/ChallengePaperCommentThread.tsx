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
import { CHALLENGE_COMMENT_DELETED } from "@/components/features/challenge/hooks/challengeCommentTree"
import { useMutateCreateChallengeCommentSwr } from "@/components/features/challenge/hooks/useMutateCreateChallengeCommentSwr"
import { useMutateDeleteChallengeCommentSwr } from "@/components/features/challenge/hooks/useMutateDeleteChallengeCommentSwr"
import { useQueryChallengeCommentsSwr } from "@/components/features/challenge/hooks/useQueryChallengeCommentsSwr"
import { toggleChallengeCommentLike } from "@/modules/api/rest/challenges"
import { RestError } from "@/modules/api/rest/client"
import type { ChallengeCommentView } from "@/modules/api/rest/challenges/types"
import type { PostComment } from "@/components/features/community/hooks/useQueryPostDetailSwr"

/** Page size for one challenge's comment thread (mirrors the BE default). */
const COMMENTS_PAGE_SIZE = 20

/**
 * Adapts ONE BE comment onto the shared {@link PostComment} contract.
 *
 * Unlike the FE-album thread, the challenge comment DTO carries a fully resolved author
 * card ({@link ChallengeCommentView.author}), so the display name and avatar are REAL —
 * nothing is invented and no per-comment profile read is needed.
 *
 * `author` rơi về `username` khi `displayName` rỗng — đúng như mọi mapper comment khác
 * (`useQueryPostDetailSwr.toReply`, `useQueryGroupThreadCommentsSwr`,
 * `useQuerySubjectPostCommentsSwr`). Trước đây chỗ này chỉ đọc `displayName`, nên tài
 * khoản chưa đặt tên hiển thị (phần lớn hồ sơ import) hiện nhãn chung "Thành viên" dù DTO
 * có username hẳn hoi — bug FE, không phải thiếu dữ liệu BE.
 *
 * `authorUsername` doubles as the thread's owner key: it prefers the real username and
 * falls back to the raw `authorId`, because {@link PostCommentThread} matches it against
 * BOTH the viewer's username and id. A commenter with no profile card therefore still gets
 * their own ⋯ menu. A tombstoned row gets an EMPTY author id on purpose: it must never
 * match the viewer, so the menu offers nothing on a comment that is already deleted.
 *
 * @param comment - The BE row.
 * @param locale - Active locale, for the relative timestamp.
 * @returns The row in the shape every thread surface renders.
 */
const toPostComment = (comment: ChallengeCommentView, locale: string): PostComment => {
    const isDeleted = comment.status === CHALLENGE_COMMENT_DELETED || comment.authorId === null
    const author = isDeleted ? null : comment.author
    return {
        id: comment.id,
        author: author?.displayName ?? author?.username ?? "",
        authorUsername: isDeleted ? "" : (author?.username ?? comment.authorId ?? ""),
        authorAvatar: author?.avatarUrl ?? null,
        text: comment.content,
        timeLabel: formatRelativeTime(comment.createdAt, locale),
        likeCount: comment.likeCount,
        likedByMe: comment.likedByMe,
        replies: (comment.replies ?? []).map((reply) => toPostComment(reply, locale)),
    }
}

/** Props for {@link ChallengePaperCommentThread}. */
export interface ChallengePaperCommentThreadProps {
    /**
     * The challenge's real UUID (BE `ChallengeView.id`) — NOT the routing slug: the
     * comment endpoints bind a `UUID` path variable.
     */
    challengeId: string
    /**
     * Rendered inside the paper's DIALOG, where the whole box scrolls as one piece — the
     * composer then has to stick to that box's bottom edge or it lands past the last
     * comment. See `PostCommentThread.stickyComposer`.
     */
    inModal?: boolean
}

/**
 * The discussion thread of ONE challenge, rendered with the house
 * {@link PostCommentThread} (one-level replies, rich composer, ⋯ row menu) fed through a
 * thin adapter over `GET/POST /challenges/{id}/comments` — the same trade
 * `FeImageCommentThread` makes.
 *
 * Likes DO work here: V318 gave the thread its own `challenge_comment_likes` table and a
 * `PUT|DELETE /challenges/comments/{id}/like` pair, so the shared heart is wired to those.
 * (This block used to say the BE had no reaction table — true when it was written, wrong
 * since V318.)
 *
 * Two affordances are still deliberately withheld:
 * - **edit** — there is no update endpoint for a challenge comment, so offering "Sửa"
 *   would be a dead button;
 * - **report** — the thread's built-in report posts `targetType: "COMMENT"` into the
 *   COMMUNITY module, and a challenge comment id does not resolve there; a report would
 *   look handled to the moderator while the comment stayed up (`canReportComments={false}`,
 *   exactly the escape hatch the thread documents for non-community surfaces).
 *
 * **Who may delete.** The row's ⋯ menu is offered on the viewer's OWN comments only — the
 * thread's owner gate, fed the viewer id. The BE also lets a SUBJECT APPROVER delete, but
 * approval rights are granted per subject and never appear in the JWT authorities, so the
 * FE cannot decide moderator-ness here without inventing a permission read; a moderator
 * deleting from this surface is left to the BE, which answers 403 to anyone else.
 *
 * Deletion is soft server-side: the row survives with the BE's tombstone body and its
 * replies intact, and the optimistic patch mirrors that instead of removing the node.
 *
 * @param props - {@link ChallengePaperCommentThreadProps}
 */
export const ChallengePaperCommentThread = ({
    challengeId,
    inModal,
}: ChallengePaperCommentThreadProps) => {
    const t = useTranslations("challenge")
    const locale = useLocale()
    const viewerId = useAppSelector((state) => state.user.user?.id)
    const { requireAuth } = useRequireAuth()

    const [page, setPage] = useState(1)
    const commentsSwr = useQueryChallengeCommentsSwr(challengeId, page)
    const create = useMutateCreateChallengeCommentSwr()
    const remove = useMutateDeleteChallengeCommentSwr()

    const total = commentsSwr.data?.total ?? 0
    const pageCount = Math.max(1, Math.ceil(total / COMMENTS_PAGE_SIZE))

    const comments = useMemo(
        () => (commentsSwr.data?.items ?? []).map((item) => toPostComment(item, locale)),
        [commentsSwr.data, locale],
    )

    /**
     * Paper-flavoured copy for the states that NAME the thing being discussed.
     *
     * The shared thread's defaults are written for a community post, so an
     * unreachable endpoint here rendered "This post no longer exists or was
     * removed" over a challenge the reader is looking at — the wrong object AND a
     * deletion that never happened. Only the object-naming lines are overridden;
     * "sign in" / "try again" / the network + server lines are the same sentence
     * on every surface and stay shared.
     */
    const labels = useMemo<CommentThreadLabels>(
        () => ({
            empty: t("paper.comments.empty"),
            loadFailed: t("paper.comments.loadFailed"),
            loadFailedAuth: t("paper.comments.loadFailedAuth"),
            loadFailedForbidden: t("paper.comments.loadFailedForbidden"),
            loadFailedGone: t("paper.comments.loadFailedGone"),
            loadFailedUnavailable: t("paper.comments.loadFailedUnavailable"),
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
                    challengeId,
                    page,
                    request: { parentId: parentCommentId, content: body },
                    viewerId,
                })
                if (!parentCommentId) {
                    // A new root belongs on page 1 (the BE lists roots newest-first).
                    setPage(1)
                }
                return true
            } catch (error) {
                // 10 comments/minute BE-side: name the rate limit instead of the generic
                // failure, so a reader who is simply typing fast knows to wait rather than
                // retrying into the same wall.
                const status = error instanceof RestError ? error.status : 0
                toast.danger(
                    status === 429
                        ? t("paper.comments.rateLimited")
                        : t("paper.comments.submitError"),
                )
                return false
            }
        },
        [requireAuth, create, challengeId, page, viewerId, t],
    )

    const onDelete = useCallback(
        (commentId: string) => {
            void (async () => {
                try {
                    await remove.remove({ commentId, challengeId, page })
                } catch {
                    toast.danger(t("paper.comments.deleteError"))
                }
            })()
        },
        [remove, challengeId, page, t],
    )

    return (
        // ponytail: same chat anatomy as the FE album — the thread FILLS the column it is
        // given (`min-h-0 flex-1`) so its composer lands on the column's bottom edge, and
        // the PAGER moved up beside the count: anything rendered after the composer would
        // push it off that edge again. In a column with no height of its own (mobile, where
        // the panes stack) `flex-1` has no free space to take, so nothing changes there.
        <div className="flex min-h-0 flex-1 flex-col gap-3">
            <div className="flex shrink-0 items-center justify-between gap-2">
                <Typography type="body-sm" weight="semibold">
                    {t("paper.comments.title", { count: total })}
                </Typography>
                {pageCount > 1 ? (
                    <div className="flex items-center gap-1">
                        <Button
                            size="sm"
                            variant="tertiary"
                            isDisabled={page <= 1 || commentsSwr.isValidating}
                            onPress={() => setPage((prev) => Math.max(1, prev - 1))}
                        >
                            {t("paper.comments.prev")}
                        </Button>
                        <Typography type="body-xs" color="muted">
                            {t("paper.comments.pageOf", { page, total: pageCount })}
                        </Typography>
                        <Button
                            size="sm"
                            variant="tertiary"
                            isDisabled={page >= pageCount || commentsSwr.isValidating}
                            onPress={() => setPage((prev) => Math.min(pageCount, prev + 1))}
                        >
                            {t("paper.comments.next")}
                        </Button>
                    </div>
                ) : null}
            </div>

            <PostCommentThread
                stickyComposer={inModal}
                className="min-h-0 flex-1"
                regionId={`challenge-comments-${challengeId}`}
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
                onToggleCommentLike={toggleChallengeCommentLike}
                currentUserId={viewerId}
                canReportComments={false}
            />
        </div>
    )
}
