"use client"

import React, { useCallback, useState } from "react"
import { Button, Typography, cn, toast } from "@heroui/react"
import { HeartIcon, PaperPlaneTiltIcon, TrashIcon } from "@phosphor-icons/react"
import { TextArea, TextField } from "@heroui/react"
import { useLocale, useTranslations } from "next-intl"
import { useParams } from "next/navigation"

import { useAppSelector } from "@/redux/hooks"
import { useRequireAuth } from "@/hooks/useRequireAuth"
import {
    useViewerAuthorCard,
    viewerOwnRowCard,
    type ViewerAuthorCard,
} from "@/hooks/useViewerAuthorCard"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import { Skeleton as SkeletonBlock } from "@/components/blocks/skeleton/Skeleton"
import { UserAvatar } from "@/components/reuseable/UserAvatar"
import { CommentComposer as CollapsibleComposer } from "@/components/reuseable/Discussion/CommentComposer"
import { Link } from "@/i18n/navigation"
import { formatRelativeTime } from "@/components/features/community/hooks/relativeTime"
import type { ResourceCommentView } from "@/modules/api/rest/resource"
import { useQueryResourceCommentsSwr } from "../../hooks/useQueryResourceCommentsSwr"
import { useMutateCreateResourceCommentSwr } from "../../hooks/useMutateCreateResourceCommentSwr"
import { useMutateDeleteResourceCommentSwr } from "../../hooks/useMutateDeleteResourceCommentSwr"
import { useMutateLikeResourceCommentSwr } from "../../hooks/useMutateLikeResourceCommentSwr"

/** Comment status the BE stamps on a soft-deleted (tombstoned) comment. */
const DELETED_STATUS = "DELETED"

/** Page size for the top-level comment list (mirrors the BE default). */
const COMMENTS_PAGE_SIZE = 20

/** Inline composer for a reply (returns `true` on success so the caller clears/collapses). */
const ReplyComposer = ({
    placeholder,
    submitLabel,
    isSubmitting,
    onSubmit,
    onCancel,
    cancelLabel,
}: {
    placeholder: string
    submitLabel: string
    isSubmitting: boolean
    onSubmit: (text: string) => Promise<boolean>
    onCancel: () => void
    cancelLabel: string
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
                        autoFocus
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
            <Button
                size="sm"
                variant="tertiary"
                className="self-start"
                isDisabled={isSubmitting}
                onPress={onCancel}
            >
                {cancelLabel}
            </Button>
        </div>
    )
}

/** One comment row (avatar + author + time + body + reply/delete affordances). */
const CommentNode = ({
    comment,
    viewerId,
    viewer,
    locale,
    isReply,
    onReply,
    onDelete,
    onToggleLike,
    isLikePending,
}: {
    comment: ResourceCommentView
    viewerId?: string
    /**
     * The reader's own session card, used ONLY to put their real photo on their own rows —
     * the C-4 comment view carries no author card, so every other row keeps the generated
     * face seeded by its `userId`. `null` (guest / unhydrated session) keeps every row on
     * that generated face, exactly as before.
     */
    viewer: ViewerAuthorCard | null
    locale: string
    isReply: boolean
    onReply?: (commentId: string) => void
    onDelete: (commentId: string) => void
    onToggleLike: (comment: ResourceCommentView) => void
    isLikePending: boolean
}) => {
    const t = useTranslations("resourceHub.comments")
    const isDeleted = comment.status === DELETED_STATUS || comment.userId === null
    const isOwner = !isDeleted && !!comment.userId && comment.userId === viewerId
    const authorLabel = isDeleted ? "—" : comment.userId === viewerId ? t("you") : t("member")
    /**
     * The viewer's own row — placeholder AND stored row alike, since both carry the same
     * `userId` — so the photo is on screen from the first frame and never swaps.
     */
    const mine = viewerOwnRowCard(viewer, comment.userId, isDeleted)
    // Both come straight from `GET /resources/{id}/comments` (root rows AND replies) — the
    // count is never derived client-side.
    const liked = comment.likedByMe ?? false
    const likeCount = comment.likeCount ?? 0

    return (
        <div className="flex items-start gap-3">
            <UserAvatar
                username={mine?.displayName ?? mine?.username ?? comment.userId ?? undefined}
                avatar={mine?.avatarUrl ?? null}
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
                    <Typography type="body-sm" color="muted" className={cn(isDeleted && "italic")}>
                        {comment.content}
                    </Typography>
                </div>

                {!isDeleted ? (
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={() => onToggleLike(comment)}
                            disabled={isLikePending}
                            aria-pressed={liked}
                            aria-label={liked ? t("unlike") : t("like")}
                            title={t("likeCount", { count: likeCount })}
                            className={cn(
                                "flex items-center gap-1 rounded-full text-xs outline-none transition-colors focus-visible:ring-2 focus-visible:ring-accent",
                                isLikePending ? "cursor-not-allowed opacity-60" : "cursor-pointer",
                                liked ? "text-accent" : "text-muted hover:text-accent",
                            )}
                        >
                            <HeartIcon
                                aria-hidden
                                focusable="false"
                                weight={liked ? "fill" : "regular"}
                                className="size-4"
                            />
                            {likeCount > 0 ? <span>{likeCount}</span> : null}
                        </button>
                        {!isReply && onReply ? (
                            <button
                                type="button"
                                onClick={() => onReply(comment.id)}
                                className="cursor-pointer rounded-full text-xs text-muted outline-none transition-colors hover:text-accent focus-visible:ring-2 focus-visible:ring-accent"
                            >
                                {t("reply")}
                            </button>
                        ) : null}
                        {isOwner ? (
                            <button
                                type="button"
                                onClick={() => onDelete(comment.id)}
                                className="flex cursor-pointer items-center gap-1 rounded-full text-xs text-muted outline-none transition-colors hover:text-danger focus-visible:ring-2 focus-visible:ring-danger"
                            >
                                <TrashIcon aria-hidden focusable="false" className="size-4" />
                                {t("delete")}
                            </button>
                        ) : null}
                    </div>
                ) : null}
            </div>
        </div>
    )
}

/** Comment list skeleton — mirrors the row layout (avatar + two text lines). */
const ResourceCommentsSkeleton = () => (
    <div className="flex flex-col gap-4">
        {[0, 1, 2].map((row) => (
            <div key={row} className="flex items-start gap-3">
                <SkeletonBlock className="size-8 shrink-0 rounded-full" />
                <div className="flex min-w-0 flex-1 flex-col gap-2">
                    <SkeletonBlock className="h-3 w-40 rounded-full" />
                    <SkeletonBlock className="h-3 w-full rounded-full" />
                </div>
            </div>
        ))}
    </div>
)

/**
 * Threaded resource Q&A comments (§5 / C-4) on the resource detail page, backed by
 * the real BE (`GET/POST /api/v1/resources/{id}/comments`, `DELETE
 * /api/v1/resources/comments/{commentId}`). Top-level comments each carry one
 * level of nested replies; a soft-deleted comment renders as a greyed tombstone
 * with its replies preserved. Owner-only delete, a per-thread reply composer, a heart on
 * every row (`PUT`/`DELETE /api/v1/resources/comments/{commentId}/like`, rendered from the
 * `likeCount`/`likedByMe` the list already carries — nothing is counted client-side), and
 * page/size pagination. Writes are optimistic and roll back on failure (the write hooks
 * own the cache patching). Guests are gated into the auth modal on submit. Mirrors
 * the course `LessonComments` real-`CommentView` pattern (author shown from
 * `userId` as "you"/"member" — the C-4 view carries no author card, so nobody ELSE'S name
 * is guessed at; the reader's own rows additionally wear their real photo, taken from the
 * session the composer above already renders and matched by `userId`, which is a field the
 * optimistic row and the stored row carry alike — so the face appears with the comment and
 * never swaps). Free-form
 * discussion only; star rating lives on `/resources/[resourceId]/reviews`.
 */
export const ResourceComments = () => {
    const t = useTranslations("resourceHub.comments")
    const locale = useLocale()
    const { resourceId } = useParams<{ resourceId: string }>()
    const viewer = useAppSelector((state) => state.user.user)
    const viewerId = viewer?.id
    const currentUser = viewer ? { username: viewer.username, avatar: viewer.avatar } : null
    // Same session the composer above already renders the reader's face from — so their own
    // comment wears the same photo as the box they typed it in, with no extra request.
    const viewerCard = useViewerAuthorCard()
    const { requireAuth: requireAuthBase } = useRequireAuth()

    const [page, setPage] = useState(1)
    const [replyingTo, setReplyingTo] = useState<string | null>(null)
    /** Comment whose like is mid-flight — only THAT heart is disabled, not the thread. */
    const [likingId, setLikingId] = useState<string | null>(null)

    const commentsSwr = useQueryResourceCommentsSwr(resourceId, page)
    const create = useMutateCreateResourceCommentSwr()
    const remove = useMutateDeleteResourceCommentSwr()
    const like = useMutateLikeResourceCommentSwr()

    const data = commentsSwr.data
    const items = data?.items ?? []
    const total = data?.total ?? 0
    const pageCount = Math.max(1, Math.ceil(total / COMMENTS_PAGE_SIZE))

    const requireAuth = useCallback(
        () => requireAuthBase("auth.context.comment") && Boolean(viewer),
        [requireAuthBase, viewer],
    )

    const submitComment = useCallback(
        async (content: string, parentId?: string): Promise<boolean> => {
            if (!requireAuth()) {
                return false
            }
            try {
                // The hook inserts the row optimistically, swaps in the server's (real id,
                // server timestamp) and rolls the page back if the write fails.
                await create.submit({
                    resourceId,
                    page,
                    request: { parentId, content },
                    viewerId,
                })
                if (parentId) {
                    setReplyingTo(null)
                } else {
                    // A new root belongs on page 1 (BE lists roots newest-first); the page the
                    // optimistic row was inserted into has already been revalidated by the hook.
                    setPage(1)
                }
                return true
            } catch {
                toast.danger(t("submitError"))
                return false
            }
        },
        [requireAuth, create, resourceId, page, viewerId, t],
    )

    const onDelete = useCallback(
        async (commentId: string) => {
            try {
                await remove.remove({ commentId, resourceId, page })
            } catch {
                toast.danger(t("deleteError"))
            }
        },
        [remove, resourceId, page, t],
    )

    const onToggleLike = useCallback(
        async (comment: ResourceCommentView) => {
            // Guests: open the auth modal instead of firing a write that would 401.
            if (!requireAuthBase("auth.context.like")) {
                return
            }
            setLikingId(comment.id)
            try {
                await like.toggle({
                    commentId: comment.id,
                    resourceId,
                    page,
                    nextLiked: !(comment.likedByMe ?? false),
                })
            } catch {
                toast.danger(t("likeError"))
            } finally {
                setLikingId(null)
            }
        },
        [requireAuthBase, like, resourceId, page, t],
    )

    const onRequestReply = useCallback(
        (commentId: string) => {
            if (!requireAuth()) {
                return
            }
            setReplyingTo(commentId)
        },
        [requireAuth],
    )

    return (
        // pb reserves space for the `<sm` fixed composer bar so the last row is never covered
        <section className="flex flex-col gap-3 border-t border-separator pb-20 pt-6 sm:pb-0">
            <div className="flex flex-wrap items-center justify-between gap-2">
                <Typography type="h6" weight="bold">
                    {t("title", { count: total })}
                </Typography>
                <Link
                    href={`/resources/${resourceId}/reviews`}
                    className="text-xs text-accent hover:underline"
                >
                    {t("goToReviews")}
                </Link>
            </div>

            {/* main composer: fixed bottom bar on <sm, inline at the top of the thread from sm: */}
            <div className="fixed inset-x-0 bottom-0 z-30 border-t border-separator bg-surface p-3 sm:static sm:z-auto sm:border-0 sm:bg-transparent sm:p-0">
                <CollapsibleComposer
                    collapsible
                    currentUser={currentUser}
                    placeholder={t("placeholder")}
                    submitLabel={t("submit")}
                    busy={create.isMutating && replyingTo === null}
                    // Gate guests BEFORE they type: a blocked expand opens the auth modal
                    // (via requireAuth) so a draft is never erased at the submit-time gate.
                    onBeforeExpand={requireAuth}
                    onSubmit={(text) => {
                        void submitComment(text)
                    }}
                />
            </div>

            <AsyncContent
                isLoading={!commentsSwr.data && !commentsSwr.error}
                skeleton={<ResourceCommentsSkeleton />}
                isEmpty={items.length === 0}
                emptyContent={{ title: t("empty") }}
                error={!commentsSwr.data ? commentsSwr.error : undefined}
                errorContent={{
                    title: t("loadError"),
                    onRetry: () => {
                        void commentsSwr.mutate()
                    },
                    retryLabel: t("retry"),
                }}
            >
                <div className="flex flex-col gap-6">
                    {items.map((comment) => (
                        <div key={comment.id} className="flex flex-col gap-3">
                            <CommentNode
                                comment={comment}
                                viewerId={viewerId}
                                viewer={viewerCard}
                                locale={locale}
                                isReply={false}
                                onReply={onRequestReply}
                                onDelete={onDelete}
                                onToggleLike={(target) => void onToggleLike(target)}
                                isLikePending={likingId === comment.id}
                            />

                            {comment.replies.length > 0 ? (
                                <div className="flex flex-col gap-4 border-l border-separator pl-4 sm:ml-11">
                                    {comment.replies.map((reply) => (
                                        <CommentNode
                                            key={reply.id}
                                            comment={reply}
                                            viewerId={viewerId}
                                            viewer={viewerCard}
                                            locale={locale}
                                            isReply
                                            onDelete={onDelete}
                                            onToggleLike={(target) => void onToggleLike(target)}
                                            isLikePending={likingId === reply.id}
                                        />
                                    ))}
                                </div>
                            ) : null}

                            {replyingTo === comment.id ? (
                                <div className="sm:ml-11">
                                    <ReplyComposer
                                        placeholder={t("replyPlaceholder")}
                                        submitLabel={t("submit")}
                                        isSubmitting={create.isMutating && replyingTo === comment.id}
                                        onSubmit={(text) => submitComment(text, comment.id)}
                                        onCancel={() => setReplyingTo(null)}
                                        cancelLabel={t("cancelReply")}
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
                                {t("prev")}
                            </Button>
                            <Typography type="body-xs" color="muted">
                                {t("pageOf", { page, total: pageCount })}
                            </Typography>
                            <Button
                                size="sm"
                                variant="tertiary"
                                isDisabled={page >= pageCount || commentsSwr.isValidating}
                                onPress={() => setPage((prev) => Math.min(pageCount, prev + 1))}
                            >
                                {t("next")}
                            </Button>
                        </div>
                    ) : null}
                </div>
            </AsyncContent>
        </section>
    )
}
