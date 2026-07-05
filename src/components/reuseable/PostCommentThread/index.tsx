"use client"

import React, { useCallback, useMemo, useState } from "react"
import { Button, Skeleton, Typography, cn } from "@heroui/react"
import { ArrowClockwiseIcon, CaretUpIcon, XIcon } from "@phosphor-icons/react"
import { useTranslations } from "next-intl"
import { UserLink } from "@/components/features/identity"
import { MarkdownContent } from "@/components/reuseable/MarkdownContent"
import { RichCommentEditor } from "@/components/reuseable/RichCommentEditor"
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
}

/** One comment row (avatar + author + time + body + optional reply affordance). */
export const CommentRow = ({
    comment,
    onReply,
    replyLabel,
    isReply,
}: {
    comment: PostComment
    onReply?: (comment: PostComment) => void
    replyLabel: string
    isReply?: boolean
}) => {
    return (
        <div className={cn("flex items-start gap-3", isReply && "ml-9")}>
            <UserLink
                username={comment.authorUsername}
                displayName={comment.author}
                hideName
                size="sm"
                classNames={{ avatar: "size-8" }}
            />
            <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                    <UserLink username={comment.authorUsername} displayName={comment.author} showAvatar={false} />
                    <Typography type="body-xs" color="muted">
                        {comment.timeLabel}
                    </Typography>
                </div>
                <MarkdownContent markdown={comment.text} />
                {!isReply && onReply ? (
                    <Button
                        size="sm"
                        variant="ghost"
                        className="mt-1 h-auto px-0 text-xs"
                        onPress={() => onReply(comment)}
                    >
                        {replyLabel}
                    </Button>
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
    className,
}: PostCommentThreadProps) => {
    const t = useTranslations("communityHub")
    const [replyTo, setReplyTo] = useState<PostComment | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isFocused, setIsFocused] = useState(false)
    const [replyFocusTrigger, setReplyFocusTrigger] = useState(0)

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
                            {comments.map((comment) => (
                                <div key={comment.id} className="flex flex-col gap-3">
                                    <CommentRow
                                        comment={comment}
                                        onReply={onReply}
                                        replyLabel={t("engagement.reply")}
                                    />
                                    {comment.replies?.map((reply) => (
                                        <CommentRow
                                            key={reply.id}
                                            comment={reply}
                                            replyLabel={t("engagement.reply")}
                                            isReply
                                        />
                                    ))}
                                </div>
                            ))}
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
