"use client"

import React, { useCallback, useEffect, useMemo, useState } from "react"
import { Typography } from "@heroui/react"
import { useLocale, useTranslations } from "next-intl"
import { useParams } from "next/navigation"
import { useAppSelector } from "@/redux/hooks"
import { UserLink } from "@/components/features/identity"
import { ThreadsPostRow } from "@/components/blocks/feed/ThreadsPostRow"
import { PostMediaGrid } from "@/components/blocks/feed/PostMediaGrid"
import {
    ConfirmDialog,
    PostEngagementBar,
    ReportDialog,
    type ReportReasonCode,
} from "@/components/reuseable/PostEngagementBar"
import { PostCommentThread } from "@/components/reuseable/PostCommentThread"
import { useQueryPostDetailSwr } from "../hooks/useQueryPostDetailSwr"
import { useMutateReactPostSwr } from "../hooks/useMutateReactPostSwr"
import { useMutateCreatePostCommentSwr, type SubmitCommentInput } from "../hooks/useMutateCreatePostCommentSwr"
import { useQueryPostMetaSwr } from "./hooks/useQueryPostMetaSwr"
import { useMutatePostOwnerActionsSwr } from "./hooks/useMutatePostOwnerActionsSwr"
import { useMutateCommentActionsSwr } from "./hooks/useMutateCommentActionsSwr"
import { useMutateReportContentSwr } from "./hooks/useMutateReportContentSwr"
import { useMutateAcceptAnswerSwr } from "./hooks/useMutateAcceptAnswerSwr"
import { useMutateSharePostSwr } from "./hooks/useMutateSharePostSwr"
import { PostEditDialog } from "./PostEditDialog"

/**
 * Community post detail (§6), Threads-style. The post rendered with the same
 * `ThreadsPostRow` anatomy as the feed (48px avatar column, name + relative
 * time on one line, title + full body in the content column) over the shared
 * engagement bar (zero counts suppressed) and a permanently-expanded comment
 * thread; a threadline runs from the author avatar toward the comments when
 * the post has any. Keeps `id="comments"` for deep links (`#comments`
 * autofocuses the composer). Post + comments load live via
 * {@link useQueryPostDetailSwr}.
 *
 * Ownership lives in the bar's ⋯ menu: the AUTHOR gets "Sửa" (minimal
 * title/body editor over `PATCH /community/posts/{id}`) and "Xoá" (confirm →
 * delete → drop from the feeds → back to `/community`); everyone else gets
 * "Báo cáo" (reason code + optional detail, auth-guarded). On a QUESTION post
 * the author can accept a top-level comment as the answer, and comment authors
 * get inline "Sửa"/"Xoá" on their own rows. A successful copy-link / native
 * share is recorded server-side fire-and-forget.
 *
 * Post KIND, the accepted answer and the raw edit prefill come from the REST
 * metadata ({@link useQueryPostMetaSwr}) — the GraphQL detail selection carries
 * none of them.
 */
export const CommunityPostDetail = () => {
    const t = useTranslations("communityHub")
    const locale = useLocale()
    const { postId } = useParams<{ postId: string }>()
    const { post } = useQueryPostDetailSwr(postId)
    const { meta } = useQueryPostMetaSwr(postId)
    const reactPost = useMutateReactPostSwr()
    const submitComment = useMutateCreatePostCommentSwr()
    const { editPost, removePost } = useMutatePostOwnerActionsSwr()
    const { editComment, removeComment } = useMutateCommentActionsSwr()
    const submitReport = useMutateReportContentSwr()
    const acceptAnswer = useMutateAcceptAnswerSwr()
    const recordShare = useMutateSharePostSwr()
    const [deepLinked, setDeepLinked] = useState(false)
    const [isEditOpen, setEditOpen] = useState(false)
    const [isDeleteOpen, setDeleteOpen] = useState(false)
    const [isReportOpen, setReportOpen] = useState(false)
    const [isDeleting, setDeleting] = useState(false)
    const currentUser = useAppSelector((state) => state.user.user)

    useEffect(() => {
        if (typeof window !== "undefined" && window.location.hash === "#comments") {
            setDeepLinked(true)
        }
    }, [])

    const onSubmit = useCallback(
        async (body: string, parentCommentId?: string): Promise<boolean> => {
            const input: SubmitCommentInput = {
                postId,
                body,
                authorLabel: locale === "vi" ? "Bạn" : "You",
                authorUsername: currentUser?.username ?? "you",
                justNowLabel: locale === "vi" ? "vừa xong" : "just now",
                parentCommentId,
            }
            return submitComment(input)
        },
        [postId, locale, submitComment, currentUser?.username],
    )

    /**
     * Owner gate. The author id from the REST metadata is authoritative (it
     * survives a display-name change); the username comparison is the fallback
     * while that request is in flight or failed. Guests match neither.
     */
    const isOwner = useMemo(() => {
        if (!currentUser) {
            return false
        }
        if (meta?.authorId) {
            return meta.authorId === currentUser.id
        }
        return Boolean(post?.authorUsername) && post?.authorUsername === currentUser.username
    }, [currentUser, meta?.authorId, post?.authorUsername])

    const onConfirmDelete = useCallback(async () => {
        setDeleting(true)
        const ok = await removePost(postId)
        setDeleting(false)
        if (ok) {
            setDeleteOpen(false)
        }
    }, [postId, removePost])

    const onReportPost = useCallback(
        (reasonCode: ReportReasonCode, detail?: string) =>
            submitReport("POST", postId, reasonCode, detail),
        [postId, submitReport],
    )

    const onEditComment = useCallback(
        (commentId: string, text: string) => editComment(postId, commentId, text),
        [postId, editComment],
    )

    const onDeleteComment = useCallback(
        (commentId: string) => {
            void removeComment(postId, commentId)
        },
        [postId, removeComment],
    )

    const onAcceptAnswer = useCallback(
        (commentId: string) => {
            void acceptAnswer(postId, commentId)
        },
        [postId, acceptAnswer],
    )

    if (!post) {
        return null
    }

    const commentsCount = post.comments.reduce(
        (total, comment) => total + 1 + (comment.replies?.length ?? 0),
        0,
    )
    const postUrl =
        typeof window !== "undefined" ? `${window.location.origin}/${locale}/community/${postId}` : ""
    // Only the author of a QUESTION post picks the accepted answer (BE contract).
    const canAcceptAnswer = isOwner && meta?.postType === "QUESTION"

    return (
        <div className="flex flex-col gap-3 py-3">
            <ThreadsPostRow
                avatar={
                    <UserLink
                        username={post.authorUsername}
                        displayName={post.author}
                        hideName
                        size="sm"
                        className="size-9"
                        classNames={{ avatar: "size-9" }}
                    />
                }
                author={<UserLink username={post.authorUsername} displayName={post.author} showAvatar={false} />}
                timeLabel={post.timeLabel}
                threadline={commentsCount > 0}
            >
                <Typography type="h5" weight="bold">
                    {post.title}
                </Typography>
                <Typography type="body-sm">{post.body}</Typography>
                <PostMediaGrid media={post.media} imageAlt={t("composer.imageAlt")} />
                <PostEngagementBar
                    likes={post.likes}
                    liked={post.liked}
                    commentsCount={commentsCount}
                    hideZeroCounts
                    onToggleLike={() => void reactPost(postId, !post.liked)}
                    onCommentClick={() => {
                        document.getElementById(`post-comments-${postId}`)?.focus()
                    }}
                    postUrl={postUrl}
                    shareTitle={post.title}
                    onShared={() => recordShare(postId)}
                    isOwner={isOwner}
                    onEdit={() => setEditOpen(true)}
                    onDelete={() => setDeleteOpen(true)}
                    onReport={() => setReportOpen(true)}
                    saveEntityType="post"
                    saveEntityId={postId}
                    saveSource={{ kind: "community", label: post.author }}
                />
            </ThreadsPostRow>

            {/* comments — hairline continues the column rhythm; threadline above points here */}
            <div id="comments" className="flex flex-col gap-3 border-t border-separator pt-3">
                <Typography type="body-sm" weight="semibold">
                    {t("detail.comments", { count: commentsCount })}
                </Typography>
                <PostCommentThread
                    regionId={`post-comments-${postId}`}
                    comments={post.comments}
                    isLoading={false}
                    onSubmit={onSubmit}
                    autoFocus={deepLinked}
                    stickyComposerOnMobile
                    currentUsername={currentUser?.username}
                    onEditComment={onEditComment}
                    onDeleteComment={onDeleteComment}
                    acceptedCommentId={meta?.acceptedCommentId}
                    canAcceptAnswer={canAcceptAnswer}
                    onAcceptAnswer={onAcceptAnswer}
                />
            </div>

            <PostEditDialog
                isOpen={isEditOpen}
                onClose={() => setEditOpen(false)}
                title={meta?.title ?? post.title}
                content={meta?.content ?? post.body}
                onSave={(input) => editPost(postId, input)}
            />

            <ConfirmDialog
                isOpen={isDeleteOpen}
                onClose={() => setDeleteOpen(false)}
                onConfirm={() => void onConfirmDelete()}
                title={t("engagement.deletePostTitle")}
                description={t("engagement.deletePostConfirm")}
                isPending={isDeleting}
            />

            <ReportDialog
                isOpen={isReportOpen}
                onClose={() => setReportOpen(false)}
                onSubmit={onReportPost}
            />
        </div>
    )
}
