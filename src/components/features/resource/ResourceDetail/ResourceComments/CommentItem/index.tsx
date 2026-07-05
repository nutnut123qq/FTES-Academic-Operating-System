"use client"

import React, { useState } from "react"
import { cn } from "@heroui/react"
import { HeartIcon } from "@phosphor-icons/react"
import { useTranslations } from "next-intl"

import { getTimeAgoLabel, getTimeAgoMessage } from "@/modules/dayjs"
import { UserLink } from "@/components/features/identity"
import type { WithClassNames } from "@/modules/types/base/class-name"
import type { ResourceCommentItem } from "../../../hooks/resource-comments-mock"
import { CommentComposer } from "../CommentComposer"

/** Props for {@link CommentItem}. */
export interface CommentItemProps extends WithClassNames<undefined> {
    /** The comment to render. */
    comment: ResourceCommentItem
    /** True when rendering a one-level reply row (no replies of its own). */
    isReply?: boolean
    /** Replies under this top-level comment, oldest-first (top-level rows only). */
    replies?: Array<ResourceCommentItem>
    /** Current viewer id (drives the delete-own affordance); null for guests. */
    currentUserId: string | null
    /** True when the inline reply composer is open under this comment. */
    isReplyComposerOpen?: boolean
    /** True while a reply create mutation is in flight. */
    isSubmittingReply?: boolean
    /** Toggle the viewer's like on a comment (optimistic; guests get gated upstream). */
    onToggleLike: (comment: ResourceCommentItem) => void
    /** Open the reply composer targeting this comment (retargeted upstream). */
    onRequestReply: (comment: ResourceCommentItem) => void
    /** Close the inline reply composer. */
    onCancelReply?: () => void
    /** Submit a reply under this top-level comment; resolves success. */
    onSubmitReply?: (text: string) => Promise<boolean>
    /** Auth gate shared with the composers. */
    onRequireAuth: () => boolean
    /** Delete one of the viewer's own comments; resolves success. */
    onDelete: (comment: ResourceCommentItem) => Promise<boolean>
}

/** Relative timestamp with a "just now" floor for fresh (optimistic) comments. */
const TimeAgo = ({ createdAt }: { createdAt: string }) => {
    const t = useTranslations()
    const isFresh = Date.now() - new Date(createdAt).getTime() < 60_000
    return (
        <span className="text-xs text-muted">
            {isFresh
                ? t("resourceHub.comments.justNow")
                : getTimeAgoLabel(getTimeAgoMessage(createdAt), t)}
        </span>
    )
}

/**
 * Threads-style minimal comment row: borderless (no card/box), avatar on the
 * left, name · relative time, the text, then a thin quiet action line —
 * ♥ like (filled red when liked, count beside), a reply link, and delete
 * (own comments only, with an inline confirm step). Top-level rows also render
 * their one-level replies + the inline reply composer inside the content
 * column, which yields the avatar-gutter indent naturally.
 * @param props - {@link CommentItemProps}
 */
export const CommentItem = ({
    comment,
    isReply,
    replies,
    currentUserId,
    isReplyComposerOpen,
    isSubmittingReply,
    onToggleLike,
    onRequestReply,
    onCancelReply,
    onSubmitReply,
    onRequireAuth,
    onDelete,
    className,
}: CommentItemProps) => {
    const t = useTranslations()
    // transient per-row UI state: delete confirm step + delete failure notice
    const [confirmingDelete, setConfirmingDelete] = useState(false)
    const [deleteFailed, setDeleteFailed] = useState(false)

    const isOwn = currentUserId !== null && currentUserId === comment.author.id

    const handleConfirmDelete = async () => {
        setConfirmingDelete(false)
        setDeleteFailed(false)
        const ok = await onDelete(comment)
        if (!ok) {
            setDeleteFailed(true)
        }
    }

    return (
        <div className={cn("flex items-start gap-3", className)}>
            <UserLink
                username={comment.author.username}
                displayName={comment.author.name}
                avatar={comment.author.avatarUrl}
                seed={comment.author.id}
                size="sm"
                hideName
                className="mt-0.5 shrink-0"
                classNames={{ avatar: "size-8" }}
            />
            <div className="flex min-w-0 flex-1 flex-col gap-2">
                <div className="flex flex-col gap-0">
                    {/* header line: name · relative time */}
                    <div className="flex flex-wrap items-center gap-2">
                        <UserLink
                            username={comment.author.username}
                            displayName={comment.author.name}
                            avatar={comment.author.avatarUrl}
                            seed={comment.author.id}
                            size="sm"
                            showAvatar={false}
                        />
                        <TimeAgo createdAt={comment.createdAt} />
                    </div>
                    <p className="whitespace-pre-wrap break-words text-sm text-foreground">
                        {comment.text}
                    </p>
                </div>

                {/* thin action line: quiet icon affordances only (no share/save) */}
                <div className="flex flex-wrap items-center gap-4">
                    <button
                        type="button"
                        aria-pressed={comment.likedByMe}
                        aria-label={
                            comment.likedByMe
                                ? t("resourceHub.comments.unlike")
                                : t("resourceHub.comments.like")
                        }
                        onClick={() => onToggleLike(comment)}
                        className={cn(
                            "flex items-center gap-2 transition-colors",
                            comment.likedByMe ? "text-danger" : "text-muted hover:text-danger",
                        )}
                    >
                        <HeartIcon
                            aria-hidden
                            focusable="false"
                            className="size-4"
                            weight={comment.likedByMe ? "fill" : "regular"}
                        />
                        <span className="text-xs" aria-hidden>
                            {comment.likeCount}
                        </span>
                        <span className="sr-only">
                            {t("resourceHub.comments.likeCount", { count: comment.likeCount })}
                        </span>
                    </button>
                    <button
                        type="button"
                        onClick={() => onRequestReply(comment)}
                        className="text-xs text-muted transition-colors hover:text-accent hover:underline"
                    >
                        {t("resourceHub.comments.reply")}
                    </button>
                    {isOwn && !confirmingDelete ? (
                        <button
                            type="button"
                            onClick={() => setConfirmingDelete(true)}
                            className="text-xs text-muted transition-colors hover:text-danger hover:underline"
                        >
                            {t("resourceHub.comments.delete")}
                        </button>
                    ) : null}
                    {isOwn && confirmingDelete ? (
                        // explicit confirmation step before the delete mutation fires
                        <span className="flex items-center gap-2">
                            <span className="text-xs text-muted">
                                {t("resourceHub.comments.deleteConfirm")}
                            </span>
                            <button
                                type="button"
                                onClick={() => {
                                    void handleConfirmDelete()
                                }}
                                className="text-xs font-medium text-danger hover:underline"
                            >
                                {t("resourceHub.comments.deleteYes")}
                            </button>
                            <button
                                type="button"
                                onClick={() => setConfirmingDelete(false)}
                                className="text-xs text-muted hover:underline"
                            >
                                {t("resourceHub.comments.deleteNo")}
                            </button>
                        </span>
                    ) : null}
                </div>
                {deleteFailed ? (
                    <span role="alert" className="text-xs text-danger">
                        {t("resourceHub.comments.deleteError")}
                    </span>
                ) : null}

                {/* one-level replies, oldest-first, indented by the avatar gutter */}
                {!isReply && replies && replies.length > 0 ? (
                    <div className="flex flex-col gap-3">
                        {replies.map((reply) => (
                            <CommentItem
                                key={reply.id}
                                comment={reply}
                                isReply
                                currentUserId={currentUserId}
                                onToggleLike={onToggleLike}
                                onRequestReply={onRequestReply}
                                onRequireAuth={onRequireAuth}
                                onDelete={onDelete}
                            />
                        ))}
                    </div>
                ) : null}

                {/* inline reply composer (stays inline on all viewports) */}
                {!isReply && isReplyComposerOpen && onSubmitReply && onCancelReply ? (
                    <CommentComposer
                        placeholder={t("resourceHub.comments.replyPlaceholder")}
                        submitLabel={t("resourceHub.comments.reply")}
                        cancelLabel={t("resourceHub.comments.cancelReply")}
                        onSubmit={onSubmitReply}
                        onCancel={onCancelReply}
                        onRequireAuth={onRequireAuth}
                        isSubmitting={Boolean(isSubmittingReply)}
                        autoFocus
                    />
                ) : null}
            </div>
        </div>
    )
}
