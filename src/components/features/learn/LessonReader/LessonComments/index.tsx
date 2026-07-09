"use client"

import React, { useState } from "react"
import { Button, TextArea, TextField, Typography, cn } from "@heroui/react"
import { ChatCircleIcon, PaperPlaneTiltIcon, ThumbsUpIcon, TrashIcon } from "@phosphor-icons/react"
import { useLocale, useTranslations } from "next-intl"
import { useAppSelector } from "@/redux/hooks"
import { useGetLessonCommentsSwr } from "@/hooks/swr/api/rest/queries/useGetLessonCommentsSwr"
import { usePostLessonCommentSwr } from "@/hooks/swr/api/rest/mutations/usePostLessonCommentSwr"
import { useDeleteLessonCommentSwr } from "@/hooks/swr/api/rest/mutations/useDeleteLessonCommentSwr"
import { usePostReactLessonCommentSwr } from "@/hooks/swr/api/rest/mutations/usePostReactLessonCommentSwr"
import { useDeleteReactLessonCommentSwr } from "@/hooks/swr/api/rest/mutations/useDeleteReactLessonCommentSwr"
import { useRestWithToast } from "@/modules/toast/hooks"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import { Skeleton as SkeletonBlock } from "@/components/blocks/skeleton/Skeleton"
import { UserAvatar } from "@/components/reuseable/UserAvatar"
import { formatRelativeTime } from "@/components/features/community/hooks/relativeTime"
import type { LessonCommentView } from "@/modules/api/rest/course"

/** Emoji key used for the simple like toggle. */
const LIKE_EMOJI = "LIKE"

/** Comment status the BE stamps on a deleted (tombstoned) comment. */
const DELETED_STATUS = "DELETED"

/** Page size for the top-level comment list. */
const COMMENTS_PAGE_SIZE = 20

/** Props for {@link LessonComments}. */
export interface LessonCommentsProps {
    courseId: string
    contentId: string
    /** Extra classes on the section root (e.g. the reading-width cap). */
    className?: string
}

/** A single inline composer (top-level or reply). */
const CommentComposer = ({
    placeholder,
    submitLabel,
    isSubmitting,
    autoFocus,
    onSubmit,
    onCancel,
    cancelLabel,
}: {
    placeholder: string
    submitLabel: string
    isSubmitting: boolean
    autoFocus?: boolean
    onSubmit: (text: string) => Promise<boolean>
    onCancel?: () => void
    cancelLabel?: string
}) => {
    const [draft, setDraft] = useState("")
    const trimmed = draft.trim()

    const handleSubmit = async () => {
        if (trimmed === "" || isSubmitting) {
            return
        }
        const ok = await onSubmit(trimmed)
        if (ok) {
            setDraft("")
        }
    }

    return (
        <div className="flex flex-col gap-2">
            <div className="flex items-end gap-2">
                <TextField variant="primary" className="flex-1">
                    <TextArea
                        rows={2}
                        value={draft}
                        onChange={(event) => setDraft(event.target.value)}
                        placeholder={placeholder}
                        aria-label={placeholder}
                        autoFocus={autoFocus}
                        className="resize-none"
                        onKeyDown={(event) => {
                            if (event.key === "Enter" && !event.shiftKey) {
                                event.preventDefault()
                                void handleSubmit()
                            }
                        }}
                    />
                </TextField>
                <Button
                    variant="primary"
                    isIconOnly
                    aria-label={submitLabel}
                    isPending={isSubmitting}
                    isDisabled={trimmed === "" || isSubmitting}
                    onPress={() => void handleSubmit()}
                >
                    <PaperPlaneTiltIcon aria-hidden focusable="false" className="size-5" />
                </Button>
            </div>
            {onCancel && cancelLabel ? (
                <Button
                    size="sm"
                    variant="tertiary"
                    className="self-start"
                    isDisabled={isSubmitting}
                    onPress={onCancel}
                >
                    {cancelLabel}
                </Button>
            ) : null}
        </div>
    )
}

/** Renders one comment row (avatar + author + time + body + actions). */
const CommentNode = ({
    comment,
    viewerId,
    locale,
    isReply,
    onLike,
    onReply,
    onDelete,
}: {
    comment: LessonCommentView
    viewerId?: string
    locale: string
    isReply: boolean
    onLike: (comment: LessonCommentView) => void
    onReply?: (commentId: string) => void
    onDelete: (commentId: string) => void
}) => {
    const t = useTranslations("learn")
    const isDeleted = comment.status === DELETED_STATUS || comment.userId === null
    const isOwner = !isDeleted && !!comment.userId && comment.userId === viewerId
    const liked = comment.myReactions.includes(LIKE_EMOJI)
    const authorLabel = isDeleted
        ? "—"
        : comment.userId === viewerId
            ? t("comments.you")
            : t("comments.member")

    return (
        <div className="flex items-start gap-3">
            <UserAvatar
                username={comment.userId ?? undefined}
                seed={comment.userId ?? "deleted"}
                size="sm"
                className={cn("size-8 shrink-0", isDeleted && "opacity-50")}
            />
            <div className="flex min-w-0 flex-1 flex-col gap-2">
                <div className="flex min-w-0 flex-col gap-0">
                    <div className="flex items-center gap-2">
                        <Typography type="body-sm" weight="medium">
                            {authorLabel}
                        </Typography>
                        <Typography type="body-xs" color="muted">
                            {formatRelativeTime(comment.createdAt, locale)}
                        </Typography>
                    </div>
                    <Typography
                        type="body-sm"
                        color="muted"
                        className={cn(isDeleted && "italic")}
                    >
                        {comment.content}
                    </Typography>
                </div>

                {!isDeleted ? (
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            aria-pressed={liked}
                            aria-label={liked ? t("comments.liked") : t("comments.like")}
                            onClick={() => onLike(comment)}
                            className={cn(
                                "flex cursor-pointer items-center gap-1 rounded-full text-xs outline-none transition-colors focus-visible:ring-2 focus-visible:ring-accent",
                                liked ? "text-accent" : "text-muted hover:text-accent",
                            )}
                        >
                            <ThumbsUpIcon
                                aria-hidden
                                focusable="false"
                                weight={liked ? "fill" : "regular"}
                                className="size-4"
                            />
                            {comment.reactionCount > 0 ? <span>{comment.reactionCount}</span> : null}
                        </button>
                        {!isReply && onReply ? (
                            <button
                                type="button"
                                onClick={() => onReply(comment.id)}
                                className="cursor-pointer rounded-full text-xs text-muted outline-none transition-colors hover:text-accent focus-visible:ring-2 focus-visible:ring-accent"
                            >
                                {t("comments.reply")}
                            </button>
                        ) : null}
                        {isOwner ? (
                            <button
                                type="button"
                                onClick={() => onDelete(comment.id)}
                                className="flex cursor-pointer items-center gap-1 rounded-full text-xs text-muted outline-none transition-colors hover:text-danger focus-visible:ring-2 focus-visible:ring-danger"
                            >
                                <TrashIcon aria-hidden focusable="false" className="size-4" />
                                {t("comments.delete")}
                            </button>
                        ) : null}
                    </div>
                ) : null}
            </div>
        </div>
    )
}

/**
 * Per-lesson threaded discussion for the reader. Renders top-level comments (each
 * with one level of nested replies), a per-thread reply composer, a like toggle,
 * and an owner-only delete. Deleted comments render as a greyed tombstone with
 * their replies preserved.
 *
 * Real BE via {@link useGetLessonCommentsSwr} + the post/delete/react/unreact
 * mutation hooks. Gated behind `!isLocked` in the reader (full access implied),
 * but a 403 still degrades to the AsyncContent error state. Self-contained under
 * the `learn.*` i18n namespace (does not reuse the community thread).
 */
export const LessonComments = ({ contentId, className }: LessonCommentsProps) => {
    const t = useTranslations("learn")
    const locale = useLocale()
    const viewerId = useAppSelector((state) => state.user.user?.id)
    const runRest = useRestWithToast()

    const [page, setPage] = useState(1)
    const commentsSwr = useGetLessonCommentsSwr(contentId, page)
    const post = usePostLessonCommentSwr()
    const remove = useDeleteLessonCommentSwr()
    const react = usePostReactLessonCommentSwr()
    const unreact = useDeleteReactLessonCommentSwr()

    const [replyingTo, setReplyingTo] = useState<string | null>(null)

    const data = commentsSwr.data
    const items = data?.items ?? []
    const total = data?.total ?? 0
    const pageCount = Math.max(1, Math.ceil(total / COMMENTS_PAGE_SIZE))

    const revalidate = () => {
        void commentsSwr.mutate()
    }

    const submitComment = async (content: string, parentId?: string): Promise<boolean> => {
        const ok = await runRest(
            () => post.trigger({ lessonId: contentId, request: { parentId, content } }),
            { successMessage: t("comments.posted") },
        )
        if (ok !== null) {
            if (parentId) {
                setReplyingTo(null)
            } else {
                setPage(1)
            }
            revalidate()
            return true
        }
        return false
    }

    const onLike = async (comment: LessonCommentView) => {
        const liked = comment.myReactions.includes(LIKE_EMOJI)
        const action = liked
            ? () => unreact.trigger({ commentId: comment.id, emoji: LIKE_EMOJI })
            : () => react.trigger({ commentId: comment.id, emoji: LIKE_EMOJI })
        const ok = await runRest(action, { showSuccessToast: false })
        if (ok !== null) {
            revalidate()
        }
    }

    const onDelete = async (commentId: string) => {
        const ok = await runRest(() => remove.trigger(commentId), {
            successMessage: t("comments.removed"),
        })
        if (ok !== null) {
            revalidate()
        }
    }

    return (
        <section className={cn("flex flex-col gap-4 border-t border-separator pt-6", className)}>
            <div className="flex items-center gap-2">
                <ChatCircleIcon aria-hidden focusable="false" className="size-5 text-muted" />
                <Typography type="body" weight="semibold">
                    {t("comments.title", { count: total })}
                </Typography>
            </div>

            <CommentComposer
                placeholder={t("comments.placeholder")}
                submitLabel={t("comments.send")}
                isSubmitting={post.isMutating && replyingTo === null}
                onSubmit={(text) => submitComment(text)}
            />

            <AsyncContent
                isLoading={!commentsSwr.data && !commentsSwr.error}
                skeleton={<CommentsSkeleton />}
                isEmpty={items.length === 0}
                emptyContent={{ title: t("comments.empty") }}
                error={!commentsSwr.data ? commentsSwr.error : undefined}
                errorContent={{
                    title: t("comments.error"),
                    onRetry: () => { void commentsSwr.mutate() },
                    retryLabel: t("common.retry"),
                }}
            >
                <div className="flex flex-col gap-6">
                    {items.map((comment) => (
                        <div key={comment.id} className="flex flex-col gap-3">
                            <CommentNode
                                comment={comment}
                                viewerId={viewerId}
                                locale={locale}
                                isReply={false}
                                onLike={onLike}
                                onReply={setReplyingTo}
                                onDelete={onDelete}
                            />

                            {/* nested replies (one level) */}
                            {comment.replies.length > 0 ? (
                                <div className="flex flex-col gap-4 border-l border-separator pl-4 sm:ml-11">
                                    {comment.replies.map((reply) => (
                                        <CommentNode
                                            key={reply.id}
                                            comment={reply}
                                            viewerId={viewerId}
                                            locale={locale}
                                            isReply
                                            onLike={onLike}
                                            onDelete={onDelete}
                                        />
                                    ))}
                                </div>
                            ) : null}

                            {/* per-thread reply composer */}
                            {replyingTo === comment.id ? (
                                <div className="sm:ml-11">
                                    <CommentComposer
                                        placeholder={t("comments.replyPlaceholder")}
                                        submitLabel={t("comments.send")}
                                        isSubmitting={post.isMutating && replyingTo === comment.id}
                                        autoFocus
                                        onSubmit={(text) => submitComment(text, comment.id)}
                                        onCancel={() => setReplyingTo(null)}
                                        cancelLabel={t("common.back")}
                                    />
                                </div>
                            ) : null}
                        </div>
                    ))}

                    {pageCount > 1 ? (
                        <div className="flex items-center justify-center gap-3">
                            <Button
                                size="sm"
                                variant="tertiary"
                                isDisabled={page <= 1 || commentsSwr.isValidating}
                                onPress={() => setPage((prev) => Math.max(1, prev - 1))}
                            >
                                {t("comments.prev")}
                            </Button>
                            <Typography type="body-xs" color="muted">
                                {t("comments.pageOf", { page, total: pageCount })}
                            </Typography>
                            <Button
                                size="sm"
                                variant="tertiary"
                                isDisabled={page >= pageCount || commentsSwr.isValidating}
                                onPress={() => setPage((prev) => Math.min(pageCount, prev + 1))}
                            >
                                {t("comments.next")}
                            </Button>
                        </div>
                    ) : null}
                </div>
            </AsyncContent>
        </section>
    )
}

/** Comment list skeleton — two rows. */
const CommentsSkeleton = () => (
    <div className="flex flex-col gap-4">
        {[0, 1].map((row) => (
            <div key={row} className="flex items-start gap-3">
                <SkeletonBlock className="size-8 shrink-0 rounded-full" />
                <div className="flex flex-1 flex-col gap-2">
                    <SkeletonBlock className="h-3 w-24 rounded-md" />
                    <SkeletonBlock className="h-3 w-3/4 rounded-md" />
                </div>
            </div>
        ))}
    </div>
)
