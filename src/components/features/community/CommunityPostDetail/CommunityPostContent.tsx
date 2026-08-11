"use client"

import React, { useCallback, useEffect, useMemo, useState } from "react"
import { Typography } from "@heroui/react"
import { useLocale, useTranslations } from "next-intl"
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
import { MarkdownContent } from "@/components/reuseable/MarkdownContent"
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

/** Props for {@link CommunityPostContent}. */
export interface CommunityPostContentProps {
    /** Post to render — the detail page reads it from the route, the lightbox from its context. */
    postId: string
    /**
     * Whether to render the post's image attachments inside the row. The detail
     * page shows them; the photo lightbox already renders the image in its own
     * pane, so it passes `false` to avoid a nested grid (and a nested lightbox).
     */
    showMedia?: boolean
    /**
     * DOM id of the comment region (the engagement bar focuses it, `aria-controls`
     * points at it). Defaults to `post-comments-{postId}`; the lightbox overrides
     * it so its region never collides with the detail page behind it.
     */
    regionId?: string
    /** DOM id of the comments anchor container (kept `comments` for `#comments` deep links). */
    commentsAnchorId?: string
    /** Rendered while the post detail is still loading (detail page → nothing; lightbox → spinner). */
    loadingFallback?: React.ReactNode
}

/**
 * The Threads-style body of a community post — the post rendered with the same
 * `ThreadsPostRow` anatomy as the feed (avatar column, name + relative time,
 * title + full body), the shared engagement bar (zero counts suppressed), and a
 * permanently-expanded comment thread with its composer. Post + comments load
 * live via {@link useQueryPostDetailSwr}; post KIND, the accepted answer, and the
 * raw edit prefill come from the REST metadata ({@link useQueryPostMetaSwr}).
 *
 * Ownership lives in the bar's ⋯ menu: the AUTHOR gets "Sửa" (minimal title/body
 * editor over `PATCH /community/posts/{id}`) and "Xoá" (confirm → delete); everyone
 * else gets "Báo cáo". On a QUESTION post the author can accept a top-level comment
 * as the answer, and comment authors get inline "Sửa"/"Xoá" on their own rows. A
 * successful copy-link / native share is recorded server-side fire-and-forget.
 *
 * Shared by {@link CommunityPostDetail} (the `/community/{postId}` page) and the
 * photo lightbox's right pane, so both surfaces reuse the exact same comment /
 * engagement / ownership wiring instead of duplicating it.
 *
 * @param props - {@link CommunityPostContentProps}
 */
export const CommunityPostContent = ({
    postId,
    showMedia = true,
    regionId,
    commentsAnchorId = "comments",
    loadingFallback = null,
}: CommunityPostContentProps) => {
    const t = useTranslations("communityHub")
    const tCommon = useTranslations("common")
    const locale = useLocale()
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

    const commentsRegionId = regionId ?? `post-comments-${postId}`

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
        return <>{loadingFallback}</>
    }

    const commentsCount = post.comments.reduce(
        (total, comment) => total + 1 + (comment.replies?.length ?? 0),
        0,
    )
    const postUrl =
        typeof window !== "undefined" ? `${window.location.origin}/${locale}/community/${postId}` : ""
    // Only the author of a QUESTION post picks the accepted answer (BE contract).
    const canAcceptAnswer = isOwner && meta?.postType === "QUESTION"
    /**
     * Name actually rendered. The mapper leaves `author` empty when the BE row carried no
     * profile card, and `UserLink` would then fall back to `username` — the raw author id
     * on those rows. One shared label keeps a uuid off the page.
     */
    const authorName = post.author || tCommon("unknownMember")

    return (
        <div className="flex flex-col gap-3 py-3">
            <ThreadsPostRow
                avatar={
                    <UserLink
                        username={post.authorUsername}
                        displayName={authorName}
                        avatar={post.authorAvatar}
                        hideName
                        size="sm"
                        className="size-9"
                        classNames={{ avatar: "size-9" }}
                    />
                }
                author={<UserLink username={post.authorUsername} displayName={authorName} showAvatar={false} />}
                timeLabel={post.timeLabel}
                threadline={commentsCount > 0}
            >
                <Typography type="h5" weight="bold">
                    {post.title}
                </Typography>
                <MarkdownContent markdown={post.body} />
                {showMedia ? (
                    <PostMediaGrid postId={postId} media={post.media} imageAlt={t("composer.imageAlt")} />
                ) : null}
                <PostEngagementBar
                    likes={post.likes}
                    liked={post.liked}
                    commentsCount={commentsCount}
                    hideZeroCounts
                    onToggleLike={() => void reactPost(postId, !post.liked)}
                    onCommentClick={() => {
                        document.getElementById(commentsRegionId)?.focus()
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
                    saveSource={{ kind: "community", label: authorName }}
                />
            </ThreadsPostRow>

            {/* comments — hairline continues the column rhythm; threadline above points here */}
            <div id={commentsAnchorId} className="flex flex-col gap-3 border-t border-separator pt-3">
                <Typography type="body-sm" weight="semibold">
                    {t("detail.comments", { count: commentsCount })}
                </Typography>
                <PostCommentThread
                    regionId={commentsRegionId}
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
