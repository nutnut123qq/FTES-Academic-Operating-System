"use client"

import React, { useCallback, useMemo, useState } from "react"
import { Button, Chip, Skeleton, Typography, cn } from "@heroui/react"
import {
    CaretUpIcon,
    CheckCircleIcon,
    XIcon,
} from "@phosphor-icons/react"
import { useTranslations } from "next-intl"
import { UserLink } from "@/components/features/identity"
import { MarkdownContent } from "@/components/reuseable/MarkdownContent"
import { RichCommentEditor } from "@/components/reuseable/RichCommentEditor"
import { RichTextEditor } from "@/components/reuseable/RichTextEditor"
import { ConfirmDialog } from "@/components/reuseable/PostEngagementBar/ConfirmDialog"
import { PostActionsMenu } from "@/components/reuseable/PostEngagementBar/PostActionsMenu"
import { ReportDialog } from "@/components/reuseable/PostEngagementBar/ReportDialog"
import type { ReportReasonCode } from "@/components/reuseable/PostEngagementBar/report-reasons"
import { useMutateReportContentSwr } from "@/components/features/community/CommunityPostDetail/hooks/useMutateReportContentSwr"
import { useRequireAuth } from "@/hooks/useRequireAuth"
import { useAppSelector } from "@/redux/hooks"
import { looksLikeUserId } from "@/utils/avatar"
import type { PostComment } from "@/components/features/community/hooks/useQueryPostDetailSwr"
import type { WithClassNames } from "@/modules/types/base/class-name"
import { CommentLoadError, type CommentThreadLabels } from "./comment-load-error"

export type { CommentThreadLabels } from "./comment-load-error"

/**
 * Submit a report for ONE comment. Resolves `true` when the report was accepted
 * (the dialog closes) and `false` otherwise (the draft is kept).
 */
export type ReportCommentHandler = (
    commentId: string,
    reasonCode: ReportReasonCode,
    detail?: string,
) => Promise<boolean>

/** Props for {@link PostCommentThread}. */
export interface PostCommentThreadProps extends WithClassNames<undefined> {
    /** DOM id of the region (referenced by the bar's `aria-controls`). */
    regionId: string
    /** The flat one-level comment list (top-level comments carry `replies`). */
    comments: Array<PostComment>
    /** First-load skeleton state (lazy fetch on expand). */
    isLoading: boolean
    /** Fetch error → inline error + retry (no toast, no collapse). */
    hasError?: boolean
    /**
     * The rejection behind `hasError`. Pass it and the inline error names the real
     * cause (offline / expired session / private post / deleted post / server) and
     * only offers a retry that can succeed — see {@link CommentLoadError}. Omitted
     * → the generic "couldn't load the comments" line with a retry, as before.
     */
    error?: unknown
    /** Re-attempt the comment fetch in place. */
    onRetry?: () => void
    /**
     * Surface-specific wording for the empty + failed states
     * ({@link CommentThreadLabels}). The defaults are written for a community
     * POST ("this post no longer exists…"), which is a lie on a challenge paper
     * or an album picture — any surface that is not a post overrides the lines
     * that name the object. Omitted / partial → the post copy, so existing
     * callers are unchanged.
     */
    labels?: CommentThreadLabels
    /**
     * Submit a comment (top-level or one-level reply). Returns `true` on success
     * (clears the composer) and `false` on failure / blocked guest (keeps the
     * draft). The caller owns optimistic append, gating, and error toasts.
     */
    onSubmit: (body: string, parentCommentId?: string) => Promise<boolean>
    /** Collapse control ("Thu gọn") — omitted on the permanently-open detail page. */
    onCollapse?: () => void
    /** Focus the composer on mount (detail page `#comments` deep link). */
    autoFocus?: boolean
    /** Pin the composer to the bottom of the viewport on mobile while focused. */
    stickyComposerOnMobile?: boolean
    /**
     * Username of the signed-in viewer. A comment whose `authorUsername` matches
     * gets the ⋯ menu's "Sửa" / "Xoá" entries; guests / other users get none —
     * and the "Báo cáo" entry shows on everyone ELSE's comments. Optional: when
     * omitted the thread falls back to the session user in the store.
     */
    currentUsername?: string
    /**
     * Id of the signed-in viewer, for surfaces whose comment mapper has no
     * profile join and degrades `authorUsername` to the raw author id (the group
     * feed / discussion threads do). Without it the owner gate would compare a
     * username against a uuid and never match — so the viewer's OWN comment would
     * wrongly offer "Báo cáo". Defaults to the session user id in the store.
     */
    currentUserId?: string
    /**
     * Save an edited comment body (author only). Resolves `true` on success.
     * Omit to hide the edit affordance entirely.
     */
    onEditComment?: (commentId: string, text: string) => Promise<boolean>
    /** Delete a comment (author only) — the row confirms first. */
    onDeleteComment?: (commentId: string) => void
    /**
     * Id of the comment already marked as the post's accepted answer (QUESTION
     * posts) — that row shows the badge and never offers "Chấp nhận".
     */
    acceptedCommentId?: string
    /**
     * Whether the viewer may accept an answer here (post author + QUESTION post).
     * Only TOP-LEVEL comments can be accepted (BE contract).
     */
    canAcceptAnswer?: boolean
    /** Mark a top-level comment as the post's accepted answer. */
    onAcceptAnswer?: (commentId: string) => void
    /**
     * Override the comment report submission (tests / surfaces with their own
     * moderation wiring). Omitted → the thread reports through the shared
     * `POST /community/reports` hook with `targetType: "COMMENT"`.
     */
    onReportComment?: ReportCommentHandler
    /**
     * Whether the BUILT-IN report path may run here. It posts `targetType:
     * "COMMENT"` with the row id, which only resolves for comments living in the
     * COMMUNITY module. Threads backed by another module (group discussion
     * threads: `/groups/{id}/discussion/threads/{threadId}/comments`) must pass
     * `false` — a report carrying a foreign id would look handled to the
     * moderator while the content stays up. Ignored when `onReportComment` is
     * supplied: that surface owns the wiring.
     */
    canReportComments?: boolean
}

/**
 * One comment row (avatar + author + time + body + optional reply affordance).
 * Owner/report actions are NOT spelled out inline — they sit in the shared ⋯
 * {@link PostActionsMenu}, exactly like a post's.
 */
export const CommentRow = ({
    comment,
    onReply,
    replyLabel,
    isReply,
    hasThreadline,
    canManage = false,
    onEdit,
    onDelete,
    isAccepted = false,
    canAccept = false,
    onAccept,
    canReport = false,
    onReport,
}: {
    comment: PostComment
    onReply?: (comment: PostComment) => void
    replyLabel: string
    isReply?: boolean
    /**
     * Draw the Threads-style vertical connector under this (top-level) comment's
     * avatar, running down to its replies. Set when the comment has replies.
     */
    hasThreadline?: boolean
    /**
     * Whether the viewer authored this comment — gates the ⋯ menu's "Sửa" / "Xoá"
     * entries (the server re-checks; this is UX only).
     */
    canManage?: boolean
    /**
     * Save an edited body. Resolves `true` on success (the row leaves edit mode)
     * and `false` on failure (the draft is kept).
     */
    onEdit?: (commentId: string, text: string) => Promise<boolean>
    /** Delete this comment after the row's confirm dialog. */
    onDelete?: (commentId: string) => void
    /** Whether this comment is the post's accepted answer (badge). */
    isAccepted?: boolean
    /**
     * Whether the viewer may accept THIS comment as the answer (post author on a
     * QUESTION post, top-level comments only).
     */
    canAccept?: boolean
    /** Mark this comment as the accepted answer. */
    onAccept?: (commentId: string) => void
    /**
     * Whether the viewer may report THIS comment — signed in AND not its author
     * (nobody reports their own comment). The server re-checks; UX gate only.
     */
    canReport?: boolean
    /** Send the report for this comment (the row owns the dialog). */
    onReport?: ReportCommentHandler
}) => {
    const t = useTranslations("communityHub")
    const tCommon = useTranslations("common")
    const [isEditing, setIsEditing] = useState(false)
    const [draft, setDraft] = useState(comment.text)
    const [isSaving, setIsSaving] = useState(false)
    const [confirmOpen, setConfirmOpen] = useState(false)
    const [reportOpen, setReportOpen] = useState(false)

    const startEdit = useCallback(() => {
        setDraft(comment.text)
        setIsEditing(true)
    }, [comment.text])

    const saveEdit = useCallback(async () => {
        const next = draft.trim()
        if (!onEdit || next.length === 0 || isSaving) {
            return
        }
        setIsSaving(true)
        const ok = await onEdit(comment.id, next)
        setIsSaving(false)
        if (ok) {
            setIsEditing(false)
        }
    }, [draft, onEdit, isSaving, comment.id])

    const showManage = canManage && (Boolean(onEdit) || Boolean(onDelete))
    const showReport = canReport && !canManage && Boolean(onReport)
    /**
     * Name actually rendered. Mappers with no profile join leave `author` empty and
     * degrade `authorUsername` to the raw author id (the owner gate needs that id — see
     * `isMine`), so without a label `UserLink` would print the uuid as the commenter's
     * name. One shared label for every thread that lands here.
     */
    const authorName =
        comment.author && !looksLikeUserId(comment.author)
            ? comment.author
            : tCommon("unknownMember")

    return (
        <div className={cn("flex items-start gap-3", isReply && "ml-9")}>
            {/* avatar column — carries the vertical threadline down to the replies */}
            <div className="flex shrink-0 flex-col items-center self-stretch">
                <UserLink
                    username={comment.authorUsername}
                    displayName={authorName}
                    avatar={comment.authorAvatar}
                    hideName
                    size="sm"
                    classNames={{ avatar: "size-8" }}
                />
                {hasThreadline ? (
                    <div aria-hidden className="mt-1 w-0.5 flex-1 rounded-full bg-separator" />
                ) : null}
            </div>
            <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                    <UserLink
                        username={comment.authorUsername}
                        displayName={authorName}
                        showAvatar={false}
                        staffRole={comment.authorStaffRole}
                    />
                    <Typography type="body-xs" color="muted">
                        {comment.timeLabel}
                    </Typography>
                    {isAccepted ? (
                        <Chip size="sm" variant="soft" color="success">
                            <Chip.Label>{t("engagement.acceptedAnswer")}</Chip.Label>
                        </Chip>
                    ) : null}
                </div>

                {isEditing ? (
                    <div className="mt-1 flex flex-col gap-2">
                        <RichTextEditor
                            value={draft}
                            onChange={setDraft}
                            toolbar="comment"
                            ariaLabel={t("engagement.editComment")}
                            disabled={isSaving}
                            autoFocus
                        />
                        <div className="flex items-center gap-2">
                            <Button
                                size="sm"
                                variant="primary"
                                onPress={() => void saveEdit()}
                                isPending={isSaving}
                                isDisabled={isSaving || draft.trim().length === 0}
                            >
                                {t("engagement.saveEdit")}
                            </Button>
                            <Button
                                size="sm"
                                variant="ghost"
                                onPress={() => setIsEditing(false)}
                                isDisabled={isSaving}
                            >
                                {t("engagement.cancel")}
                            </Button>
                        </div>
                    </div>
                ) : (
                    <MarkdownContent markdown={comment.text} />
                )}

                {!isEditing ? (
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                        {!isReply && onReply ? (
                            <Button
                                size="sm"
                                variant="ghost"
                                className="h-auto px-0 text-xs"
                                onPress={() => onReply(comment)}
                            >
                                {replyLabel}
                            </Button>
                        ) : null}
                        {canAccept && onAccept && !isAccepted ? (
                            <Button
                                size="sm"
                                variant="ghost"
                                className="h-auto px-0 text-xs text-success"
                                onPress={() => onAccept(comment.id)}
                            >
                                <CheckCircleIcon aria-hidden focusable="false" className="size-4" />
                                {t("engagement.acceptAnswer")}
                            </Button>
                        ) : null}
                        {/* "Sửa" / "Xoá" / "Báo cáo" live behind the ⋯ overflow menu — the
                            SAME {@link PostActionsMenu} a post uses. Only "Trả lời" (and the
                            QUESTION-author "Chấp nhận") stay spelled out inline. The gate is
                            unchanged: the menu shows the owner entries only to the author and
                            the report entry only to everybody else, and renders nothing at all
                            when no entry is available. */}
                        <PostActionsMenu
                            isOwner={canManage}
                            onEdit={onEdit ? startEdit : undefined}
                            onDelete={onDelete ? () => setConfirmOpen(true) : undefined}
                            onReport={showReport ? () => setReportOpen(true) : undefined}
                        />
                    </div>
                ) : null}

                {showManage && onDelete ? (
                    <ConfirmDialog
                        isOpen={confirmOpen}
                        onClose={() => setConfirmOpen(false)}
                        onConfirm={() => {
                            setConfirmOpen(false)
                            onDelete(comment.id)
                        }}
                        title={t("engagement.deleteCommentTitle")}
                        description={t("engagement.deleteCommentConfirm")}
                    />
                ) : null}

                {showReport && onReport ? (
                    <ReportDialog
                        isOpen={reportOpen}
                        onClose={() => setReportOpen(false)}
                        onSubmit={(reasonCode, detail) => onReport(comment.id, reasonCode, detail)}
                    />
                ) : null}
            </div>
        </div>
    )
}

/**
 * Inline expandable comment region shared by every feed's push-down expansion
 * AND the post detail's comments section (detail renders it permanently open).
 * Renders the comment list (flat one-level replies) + the composer, in document
 * flow (pure push-down — no overlay, no fixed height).
 *
 * States: `isLoading` → skeleton comment rows; `hasError` → inline localized
 * error (in place, no collapse) that names the CAUSE when the caller also passes
 * the `error` itself and offers only the action that can fix it (retry / sign in
 * / nothing) — see {@link CommentLoadError}; otherwise the thread + composer. The
 * wording of those two non-conversation states defaults to community-POST copy and
 * is overridable per surface through `labels` ({@link CommentThreadLabels}), which
 * a thread hanging off a challenge paper or an album picture must use — its object
 * is not a post. The
 * composer supports one-level reply mode (a "replying to" chip with cancel that
 * keeps the draft), an empty-input guard, and draft-preserving failure handling
 * (the caller's `onSubmit` returns `false` to keep the text). On mobile the
 * composer sticks to the bottom of the viewport while focused when
 * `stickyComposerOnMobile` is set.
 *
 * Per-comment affordances (all opt-in via callbacks, so surfaces that pass none
 * render exactly as before) all live in the row's ⋯ {@link PostActionsMenu} —
 * only "Trả lời" (and the accept-answer action) stays inline: the viewer's OWN
 * comments (`authorUsername === currentUsername`) get "Sửa" (a rich editor, draft
 * kept on failure) and "Xoá" (confirm dialog); on a QUESTION post the post author
 * can accept a TOP-LEVEL comment as the answer, and the accepted one wears a badge
 * instead of the action. Every OTHER person's comment (top-level or reply) offers
 * "Báo cáo" to a signed-in viewer, opening the shared {@link ReportDialog} and
 * posting `targetType: "COMMENT"` — guests and the comment's own author get none,
 * and threads outside the community module opt out via `canReportComments={false}`.
 *
 * The region is focusable (`tabIndex={-1}` + localized accessible name) so the
 * bar can move focus into it on expand.
 *
 * @param props - {@link PostCommentThreadProps}
 */
export const PostCommentThread = ({
    regionId,
    comments,
    isLoading,
    hasError,
    error,
    onRetry,
    labels,
    onSubmit,
    onCollapse,
    autoFocus,
    stickyComposerOnMobile,
    currentUsername,
    currentUserId,
    onEditComment,
    onDeleteComment,
    acceptedCommentId,
    canAcceptAnswer = false,
    onAcceptAnswer,
    onReportComment,
    canReportComments = true,
    className,
}: PostCommentThreadProps) => {
    const t = useTranslations("communityHub")
    const tCommon = useTranslations("common")
    const { authenticated } = useRequireAuth()
    const submitReport = useMutateReportContentSwr()
    /**
     * Viewer identity for the owner gate. Surfaces that already pass
     * `currentUsername` / `currentUserId` win; the rest fall back to the session
     * user so "Báo cáo" never shows on the viewer's OWN comment (edit/delete stay
     * opt-in via their callbacks, so the fallback changes nothing for them).
     */
    const sessionUsername = useAppSelector((state) => state.user.user?.username)
    const sessionUserId = useAppSelector((state) => state.user.user?.id)
    const [replyTo, setReplyTo] = useState<PostComment | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isFocused, setIsFocused] = useState(false)
    const [replyFocusTrigger, setReplyFocusTrigger] = useState(0)

    /**
     * Owner gate for the inline comment affordances (guest → never mine). The row
     * carries `authorUsername`, but mappers with no profile join degrade it to the
     * raw author id, so the viewer id counts as a match too (same degradation the
     * post detail's owner gate makes with `meta.authorId === currentUser.id`).
     */
    const isMine = useCallback(
        (authorUsername: string) => {
            const viewerName = currentUsername ?? sessionUsername
            const viewerId = currentUserId ?? sessionUserId
            return (
                (Boolean(viewerName) && authorUsername === viewerName) ||
                (Boolean(viewerId) && authorUsername === viewerId)
            )
        },
        [currentUsername, currentUserId, sessionUsername, sessionUserId],
    )

    /** Report ONE comment — the override when given, else the shared hook. */
    const reportComment = useCallback<ReportCommentHandler>(
        (commentId, reasonCode, detail) =>
            onReportComment
                ? onReportComment(commentId, reasonCode, detail)
                : submitReport("COMMENT", commentId, reasonCode, detail),
        [onReportComment, submitReport],
    )

    /**
     * Whether a row may offer "Báo cáo" at all: signed in, plus either the surface
     * wired its own handler or the built-in community path is valid here.
     */
    const reportEnabled = authenticated && (Boolean(onReportComment) || canReportComments)

    const onReply = useCallback((comment: PostComment) => {
        setReplyTo(comment)
        setReplyFocusTrigger((value) => value + 1)
    }, [])

    const cancelReply = useCallback(() => {
        setReplyTo(null)
    }, [])

    const handleSubmit = useCallback(
        async (body: string) => {
            if (isSubmitting) {
                return false
            }
            setIsSubmitting(true)
            const ok = await onSubmit(body, replyTo?.id)
            setIsSubmitting(false)
            if (ok) {
                setReplyTo(null)
            }
            return ok
        },
        [isSubmitting, onSubmit, replyTo],
    )

    const placeholder = useMemo(
        () => (replyTo ? t("engagement.replyPlaceholder") : t("engagement.commentPlaceholder")),
        [replyTo, t],
    )

    return (
        <div
            id={regionId}
            role="region"
            aria-label={t("engagement.commentsRegion")}
            tabIndex={-1}
            className={cn("flex flex-col gap-3 pt-3 outline-none", className)}
        >
            {isLoading ? (
                <div className="flex flex-col gap-3">
                    {[0, 1].map((row) => (
                        <div key={row} className="flex items-start gap-3">
                            <Skeleton className="size-8 shrink-0 rounded-full" />
                            <div className="flex flex-1 flex-col gap-2">
                                <Skeleton className="h-3 w-24 rounded-md" />
                                <Skeleton className="h-3 w-3/4 rounded-md" />
                            </div>
                        </div>
                    ))}
                </div>
            ) : hasError ? (
                <CommentLoadError error={error} onRetry={onRetry} labels={labels} />
            ) : (
                <>
                    {comments.length === 0 ? (
                        <Typography type="body-sm" color="muted">
                            {labels?.empty ?? t("engagement.commentsEmpty")}
                        </Typography>
                    ) : (
                        <div className="flex flex-col gap-3">
                            {comments.map((comment) => {
                                const replies = comment.replies ?? []
                                return (
                                    <div key={comment.id} className="flex flex-col gap-3">
                                        <CommentRow
                                            comment={comment}
                                            onReply={onReply}
                                            replyLabel={t("engagement.reply")}
                                            hasThreadline={replies.length > 0}
                                            canManage={isMine(comment.authorUsername)}
                                            onEdit={onEditComment}
                                            onDelete={onDeleteComment}
                                            isAccepted={acceptedCommentId === comment.id}
                                            canAccept={canAcceptAnswer}
                                            onAccept={onAcceptAnswer}
                                            canReport={reportEnabled && !isMine(comment.authorUsername)}
                                            onReport={reportComment}
                                        />
                                        {replies.map((reply, index) => {
                                            const isLast = index === replies.length - 1
                                            return (
                                                <div key={reply.id} className="relative">
                                                    {/* trunk: continues the avatar threadline; the
                                                        last reply stops at the avatar center */}
                                                    <span
                                                        aria-hidden
                                                        className={cn(
                                                            "pointer-events-none absolute left-4 -top-3 w-0.5 -translate-x-1/2 bg-separator",
                                                            isLast ? "h-7" : "bottom-0",
                                                        )}
                                                    />
                                                    {/* elbow: connects the trunk to the reply avatar */}
                                                    <span
                                                        aria-hidden
                                                        className="pointer-events-none absolute left-4 top-4 h-0.5 w-5 bg-separator"
                                                    />
                                                    <CommentRow
                                                        comment={reply}
                                                        replyLabel={t("engagement.reply")}
                                                        isReply
                                                        canManage={isMine(reply.authorUsername)}
                                                        onEdit={onEditComment}
                                                        onDelete={onDeleteComment}
                                                        canReport={
                                                            reportEnabled && !isMine(reply.authorUsername)
                                                        }
                                                        onReport={reportComment}
                                                    />
                                                </div>
                                            )
                                        })}
                                    </div>
                                )
                            })}
                        </div>
                    )}

                    {/* composer */}
                    <div
                        className={cn(
                            "flex flex-col gap-2",
                            stickyComposerOnMobile &&
                                isFocused &&
                                "max-sm:fixed max-sm:inset-x-0 max-sm:bottom-0 max-sm:z-30 max-sm:border-t max-sm:border-separator max-sm:bg-background max-sm:p-3",
                        )}
                    >
                        {replyTo ? (
                            <div className="flex items-center gap-2">
                                <Typography type="body-xs" color="muted">
                                    {t("engagement.replyingTo", {
                                        name:
                                            replyTo.author && !looksLikeUserId(replyTo.author)
                                                ? replyTo.author
                                                : tCommon("unknownMember"),
                                    })}
                                </Typography>
                                <Button
                                    isIconOnly
                                    size="sm"
                                    variant="ghost"
                                    aria-label={t("engagement.cancelReply")}
                                    onPress={cancelReply}
                                >
                                    <XIcon aria-hidden focusable="false" className="size-4" />
                                </Button>
                            </div>
                        ) : null}

                        <RichCommentEditor
                            placeholder={placeholder}
                            autoFocus={autoFocus}
                            isPending={isSubmitting}
                            focusTrigger={replyFocusTrigger}
                            onFocus={() => setIsFocused(true)}
                            onBlur={() => setIsFocused(false)}
                            onSubmit={handleSubmit}
                        />
                    </div>

                    {onCollapse ? (
                        <Button
                            size="sm"
                            variant="ghost"
                            className="self-start px-0 text-xs"
                            onPress={onCollapse}
                        >
                            <CaretUpIcon aria-hidden focusable="false" className="size-4" />
                            {t("engagement.collapse")}
                        </Button>
                    ) : null}
                </>
            )}
        </div>
    )
}
