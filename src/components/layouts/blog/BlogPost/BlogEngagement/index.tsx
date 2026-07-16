"use client"

import React, { useEffect, useMemo, useState } from "react"
import { Button, Modal, Typography, cn } from "@heroui/react"
import { HeartIcon } from "@phosphor-icons/react"
import { useTranslations } from "next-intl"

import { useAppSelector } from "@/redux/hooks"
import { useRequireAuth } from "@/hooks/useRequireAuth"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import { useGetBlogCommentsSwr } from "@/hooks/swr/api/rest/queries/useGetBlogCommentsSwr"
import { usePostCreateBlogCommentSwr } from "@/hooks/swr/api/rest/mutations/usePostCreateBlogCommentSwr"
import { usePostUpdateBlogCommentSwr } from "@/hooks/swr/api/rest/mutations/usePostUpdateBlogCommentSwr"
import { usePostDeleteBlogCommentSwr } from "@/hooks/swr/api/rest/mutations/usePostDeleteBlogCommentSwr"
import { usePostReactToBlogPostSwr } from "@/hooks/swr/api/rest/mutations/usePostReactToBlogPostSwr"
import { usePostReactToBlogCommentSwr } from "@/hooks/swr/api/rest/mutations/usePostReactToBlogCommentSwr"
import type { BlogCommentResponse } from "@/modules/api/rest/blog"
import { CommentComposer } from "./CommentComposer"
import { CommentItem } from "./CommentItem"
import { mergeComments, sortComments } from "./helpers"

/** Comment page size — matches the spec ("size 20, load more while hasNext"). */
const COMMENTS_PAGE_SIZE = 20

/** Props for {@link BlogEngagement}. */
export interface BlogEngagementProps {
    /** UUID of the post the engagement zone belongs to. */
    postId: string
    /** The post's reaction count from the article payload (seeds the heart count). */
    initialEmojiCount: number
}

/** Local skeleton mirroring the flat comment rows (avatar + two text lines). */
const CommentsSkeleton = () => (
    <div className="flex flex-col gap-4" aria-hidden>
        {[0, 1, 2].map((row) => (
            <div key={row} className="flex items-start gap-3">
                <div className="size-8 shrink-0 animate-pulse rounded-full bg-default" />
                <div className="flex min-w-0 flex-1 flex-col gap-2">
                    <div className="h-3 w-40 animate-pulse rounded-full bg-default" />
                    <div className="h-3 w-full animate-pulse rounded-full bg-default" />
                </div>
            </div>
        ))}
    </div>
)

/**
 * Engagement zone rendered below a blog article body: a post reaction bar (heart
 * toggle wired to `PUT /blog/posts/{id}/reaction`) and a FLAT comment thread —
 * paginated read (public), a composer for signed-in users, per-comment heart, and
 * owner-only inline edit + confirm-modal delete.
 *
 * Data owner: it accumulates comment pages into a `Map<id, comment>` (deduplicated,
 * "load more" while `hasNext`) and mutates that map locally on create/edit/delete
 * so the thread stays consistent without a full refetch. Every write control is
 * gated through {@link useRequireAuth}; guests can READ but a click on any heart or
 * the sign-in affordance opens the auth modal and fires no request. Reaction state
 * follows the returned `{reacted, emojiCount}` as the source of truth (the GET does
 * not report the viewer's own reaction, so hearts start neutral until first toggle).
 * @param props - {@link BlogEngagementProps}
 */
export const BlogEngagement = ({ postId, initialEmojiCount }: BlogEngagementProps) => {
    const t = useTranslations("blog.engagement")
    const user = useAppSelector((state) => state.user.user)
    const { authenticated, requireAuth } = useRequireAuth()

    // ---- post reaction ----
    // reacted starts null (BE GET does not report the viewer's own reaction); the
    // count seeds from the article payload and, after the first toggle, follows the
    // returned BlogReactionResult as the source of truth.
    const [postReacted, setPostReacted] = useState<boolean | null>(null)
    const [postCount, setPostCount] = useState(initialEmojiCount)
    const reactPost = usePostReactToBlogPostSwr()

    const handlePostReaction = () => {
        if (!requireAuth("auth.context.like") || reactPost.isMutating) {
            return
        }
        void reactPost
            .trigger(postId)
            .then((result) => {
                setPostReacted(result.reacted)
                setPostCount(result.emojiCount)
            })
            .catch(() => {
                // transient failure: leave the prior state untouched
            })
    }

    // ---- comment pagination + accumulation ----
    const [page, setPage] = useState(0)
    const [commentsById, setCommentsById] = useState<Map<string, BlogCommentResponse>>(
        () => new Map(),
    )
    // per-comment reaction state, populated from each toggle's returned `reacted`
    const [reactedById, setReactedById] = useState<Record<string, boolean>>({})
    // id of the comment whose reaction toggle is currently in flight (blocks double-toggle)
    const [reactingCommentId, setReactingCommentId] = useState<string | null>(null)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [deleteTarget, setDeleteTarget] = useState<BlogCommentResponse | null>(null)
    const [deleteFailed, setDeleteFailed] = useState(false)

    const commentsSwr = useGetBlogCommentsSwr({ postId, page, size: COMMENTS_PAGE_SIZE })
    const createComment = usePostCreateBlogCommentSwr()
    const updateComment = usePostUpdateBlogCommentSwr()
    const deleteComment = usePostDeleteBlogCommentSwr()
    const reactComment = usePostReactToBlogCommentSwr()

    // merge each resolved page into the running accumulator (deduplicated by id)
    useEffect(() => {
        setCommentsById((prev) => mergeComments(prev, commentsSwr.data?.items))
    }, [commentsSwr.data])

    const comments = useMemo(() => sortComments(commentsById), [commentsById])
    const hasNext = commentsSwr.data?.hasNext ?? false
    const isFirstLoad = commentsSwr.isLoading && commentsById.size === 0

    const handleCreate = async (text: string) => {
        if (!user) {
            return false
        }
        try {
            const created = await createComment.trigger({ postId, request: { content: text } })
            setCommentsById((prev) => new Map(prev).set(created.id, created))
            return true
        } catch {
            return false
        }
    }

    const handleSubmitEdit = async (comment: BlogCommentResponse, text: string) => {
        try {
            const updated = await updateComment.trigger({
                id: comment.id,
                request: { content: text },
            })
            setCommentsById((prev) => new Map(prev).set(updated.id, updated))
            setEditingId(null)
            return true
        } catch {
            return false
        }
    }

    const handleConfirmDelete = async () => {
        if (!deleteTarget) {
            return
        }
        const targetId = deleteTarget.id
        try {
            await deleteComment.trigger(targetId)
            setCommentsById((prev) => {
                const next = new Map(prev)
                next.delete(targetId)
                return next
            })
            setDeleteTarget(null)
        } catch {
            setDeleteFailed(true)
        }
    }

    const handleCommentReaction = (comment: BlogCommentResponse) => {
        // guard guests and, like the post heart, block a second toggle while one is in flight
        if (!requireAuth("auth.context.like") || reactComment.isMutating) {
            return
        }
        setReactingCommentId(comment.id)
        void reactComment
            .trigger(comment.id)
            .then((result) => {
                setReactedById((prev) => ({ ...prev, [comment.id]: result.reacted }))
                setCommentsById((prev) => {
                    const current = prev.get(comment.id)
                    if (!current) {
                        return prev
                    }
                    const next = new Map(prev)
                    next.set(comment.id, { ...current, emojiCount: result.emojiCount })
                    return next
                })
            })
            .catch(() => {
                // transient failure: leave the prior state untouched
            })
            .finally(() => {
                setReactingCommentId(null)
            })
    }

    return (
        <section className="flex flex-col gap-6 border-t border-separator pt-6">
            {/* post reaction bar */}
            <div className="flex items-center gap-3">
                <Button
                    variant="tertiary"
                    aria-pressed={postReacted === true}
                    aria-label={postReacted === true ? t("unlikeLabel") : t("likesLabel")}
                    isDisabled={reactPost.isMutating}
                    onPress={handlePostReaction}
                >
                    <HeartIcon
                        aria-hidden
                        focusable="false"
                        className={cn("size-5", postReacted === true && "text-accent")}
                        weight={postReacted === true ? "fill" : "regular"}
                    />
                    <span>{postCount}</span>
                    <span className="sr-only">{t("likeCount", { count: postCount })}</span>
                </Button>
            </div>

            {/* comment thread */}
            <div className="flex flex-col gap-4">
                <Typography type="h6" weight="bold">
                    {t("commentsTitle", { count: commentsById.size })}
                </Typography>

                {/* composer (signed-in) or a sign-in affordance (guest) */}
                {authenticated && user ? (
                    <CommentComposer
                        placeholder={t("commentPlaceholder")}
                        submitLabel={t("submit")}
                        onSubmit={handleCreate}
                        isSubmitting={createComment.isMutating}
                    />
                ) : (
                    <Button
                        variant="secondary"
                        className="self-start"
                        onPress={() => requireAuth("auth.context.comment")}
                    >
                        {t("signInToComment")}
                    </Button>
                )}

                <AsyncContent
                    isLoading={isFirstLoad}
                    skeleton={<CommentsSkeleton />}
                    error={commentsById.size === 0 ? commentsSwr.error : undefined}
                    errorContent={{
                        title: t("loadError"),
                        onRetry: () => {
                            void commentsSwr.mutate()
                        },
                        retryLabel: t("retry"),
                    }}
                    isEmpty={commentsById.size === 0}
                    emptyContent={{ title: t("empty") }}
                >
                    <div className="flex flex-col gap-4">
                        {comments.map((comment) => (
                            <CommentItem
                                key={comment.id}
                                comment={comment}
                                currentUserId={user?.id ?? null}
                                reacted={reactedById[comment.id]}
                                isReacting={reactingCommentId === comment.id}
                                isEditing={editingId === comment.id}
                                isSavingEdit={updateComment.isMutating && editingId === comment.id}
                                onToggleReaction={handleCommentReaction}
                                onStartEdit={(target) => setEditingId(target.id)}
                                onCancelEdit={() => setEditingId(null)}
                                onSubmitEdit={handleSubmitEdit}
                                onRequestDelete={(target) => {
                                    setDeleteFailed(false)
                                    setDeleteTarget(target)
                                }}
                            />
                        ))}

                        {hasNext ? (
                            <Button
                                variant="tertiary"
                                className="self-center"
                                isDisabled={commentsSwr.isLoading}
                                isPending={commentsSwr.isLoading}
                                onPress={() => setPage((current) => current + 1)}
                            >
                                {t("loadMore")}
                            </Button>
                        ) : null}
                    </div>
                </AsyncContent>
            </div>

            {/* delete confirmation modal */}
            <Modal
                isOpen={deleteTarget !== null}
                onOpenChange={(open) => {
                    if (!open) {
                        setDeleteTarget(null)
                    }
                }}
            >
                <Modal.Backdrop>
                    <Modal.Container>
                        <Modal.Dialog className="w-full max-w-md">
                            <Modal.Header>
                                <Typography type="body" weight="bold">
                                    {t("confirmDeleteTitle")}
                                </Typography>
                            </Modal.Header>
                            <Modal.Body className="flex flex-col gap-2">
                                <Typography type="body-sm" color="muted">
                                    {t("confirmDeleteBody")}
                                </Typography>
                                {deleteFailed ? (
                                    <span role="alert" className="text-sm text-danger">
                                        {t("deleteError")}
                                    </span>
                                ) : null}
                            </Modal.Body>
                            <Modal.Footer className="justify-end gap-2">
                                <Button
                                    variant="ghost"
                                    onPress={() => setDeleteTarget(null)}
                                    isDisabled={deleteComment.isMutating}
                                >
                                    {t("cancel")}
                                </Button>
                                <Button
                                    variant="danger"
                                    onPress={() => {
                                        void handleConfirmDelete()
                                    }}
                                    isPending={deleteComment.isMutating}
                                >
                                    {t("confirmDelete")}
                                </Button>
                            </Modal.Footer>
                        </Modal.Dialog>
                    </Modal.Container>
                </Modal.Backdrop>
            </Modal>
        </section>
    )
}
