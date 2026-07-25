"use client"

import React, { useCallback, useMemo, useState } from "react"
import { Button, Chip, Skeleton, TextArea, TextField, Typography, cn } from "@heroui/react"
import {
    ArrowClockwiseIcon,
    CaretUpIcon,
    CheckCircleIcon,
    XIcon,
} from "@phosphor-icons/react"
import { useTranslations } from "next-intl"
import { UserLink } from "@/components/features/identity"
import { MarkdownContent } from "@/components/reuseable/MarkdownContent"
import { RichCommentEditor } from "@/components/reuseable/RichCommentEditor"
import { ConfirmDialog } from "@/components/reuseable/PostEngagementBar/ConfirmDialog"
import type { PostComment } from "@/components/features/community/hooks/useQueryPostDetailSwr"
import type { WithClassNames } from "@/modules/types/base/class-name"

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
    /** Re-attempt the comment fetch in place. */
    onRetry?: () => void
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
     * gets the inline "Sửa" / "Xoá" affordances; guests / other users get none.
     */
    currentUsername?: string
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
}

/** One comment row (avatar + author + time + body + optional reply affordance). */
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
     * Whether the viewer authored this comment — gates the inline "Sửa" / "Xoá"
     * affordances (the server re-checks; this is UX only).
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
}) => {
    const t = useTranslations("communityHub")
    const [isEditing, setIsEditing] = useState(false)
    const [draft, setDraft] = useState(comment.text)
    const [isSaving, setIsSaving] = useState(false)
    const [confirmOpen, setConfirmOpen] = useState(false)

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

    return (
        <div className={cn("flex items-start gap-3", isReply && "ml-9")}>
            {/* avatar column — carries the vertical threadline down to the replies */}
            <div className="flex shrink-0 flex-col items-center self-stretch">
                <UserLink
                    username={comment.authorUsername}
                    displayName={comment.author}
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
                    <UserLink username={comment.authorUsername} displayName={comment.author} showAvatar={false} />
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
                        <TextField variant="secondary" className="w-full">
                            <TextArea
                                rows={3}
                                value={draft}
                                onChange={(event) => setDraft(event.target.value)}
                                aria-label={t("engagement.editComment")}
                                className="resize-y"
                                disabled={isSaving}
                            />
                        </TextField>
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
                        {showManage && onEdit ? (
                            <Button
                                size="sm"
                                variant="ghost"
                                className="h-auto px-0 text-xs"
                                onPress={startEdit}
                            >
                                {t("engagement.edit")}
                            </Button>
                        ) : null}
                        {showManage && onDelete ? (
                            <Button
                                size="sm"
                                variant="ghost"
                                className="h-auto px-0 text-xs"
                                onPress={() => setConfirmOpen(true)}
                            >
                                {t("engagement.delete")}
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
 * error + retry (in place, no collapse); otherwise the thread + composer. The
 * composer supports one-level reply mode (a "replying to" chip with cancel that
 * keeps the draft), an empty-input guard, and draft-preserving failure handling
 * (the caller's `onSubmit` returns `false` to keep the text). On mobile the
 * composer sticks to the bottom of the viewport while focused when
 * `stickyComposerOnMobile` is set.
 *
 * Per-comment affordances (all opt-in via callbacks, so surfaces that pass none
 * render exactly as before): the viewer's OWN comments (`authorUsername ===
 * currentUsername`) get inline "Sửa" (a minimal markdown textarea, draft kept on
 * failure) and "Xoá" (confirm dialog); on a QUESTION post the post author can
 * accept a TOP-LEVEL comment as the answer, and the accepted one wears a badge
 * instead of the action.
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
    onRetry,
    onSubmit,
    onCollapse,
    autoFocus,
    stickyComposerOnMobile,
    currentUsername,
    onEditComment,
    onDeleteComment,
    acceptedCommentId,
    canAcceptAnswer = false,
    onAcceptAnswer,
    className,
}: PostCommentThreadProps) => {
    const t = useTranslations("communityHub")
    const [replyTo, setReplyTo] = useState<PostComment | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isFocused, setIsFocused] = useState(false)
    const [replyFocusTrigger, setReplyFocusTrigger] = useState(0)

    /** Owner gate for the inline comment affordances (guest → never mine). */
    const isMine = useCallback(
        (authorUsername: string) =>
            Boolean(currentUsername) && authorUsername === currentUsername,
        [currentUsername],
    )

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
                <div className="flex flex-col items-start gap-2">
                    <Typography type="body-sm" color="muted">
                        {t("engagement.commentsLoadFailed")}
                    </Typography>
                    {onRetry ? (
                        <Button size="sm" variant="secondary" onPress={onRetry}>
                            <ArrowClockwiseIcon aria-hidden focusable="false" className="size-4" />
                            {t("engagement.retry")}
                        </Button>
                    ) : null}
                </div>
            ) : (
                <>
                    {comments.length === 0 ? (
                        <Typography type="body-sm" color="muted">
                            {t("engagement.commentsEmpty")}
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
                                    {t("engagement.replyingTo", { name: replyTo.author })}
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
