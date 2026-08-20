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
import { toggleCommentReaction } from "@/modules/api/rest/community"
import { MarkdownContent } from "@/components/reuseable/MarkdownContent"
import { LinkPreview } from "@/components/reuseable/LinkPreview"
import { QuotedPostCard } from "@/components/reuseable/QuotedPostCard"
import { CommunityPoll } from "../CommunityPoll"
import { firstLinkUrl, unwrapAutolinks } from "./postLinks"
import { CommentLoadError } from "@/components/reuseable/PostCommentThread/comment-load-error"
import { useQueryPostDetailSwr } from "../hooks/useQueryPostDetailSwr"
import { useMutateReactPostSwr } from "../hooks/useMutateReactPostSwr"
import { useMutateCreatePostCommentSwr, type SubmitCommentInput } from "../hooks/useMutateCreatePostCommentSwr"
import { useQueryPostMetaSwr } from "./hooks/useQueryPostMetaSwr"
import { useMutatePostOwnerActionsSwr } from "./hooks/useMutatePostOwnerActionsSwr"
import { useMutateCommentActionsSwr } from "./hooks/useMutateCommentActionsSwr"
import { useMutateReportContentSwr } from "./hooks/useMutateReportContentSwr"
import { useMutateAcceptAnswerSwr } from "./hooks/useMutateAcceptAnswerSwr"
import { useMutateSharePostSwr } from "./hooks/useMutateSharePostSwr"
import { useCommunityComposerOverlayState } from "@/hooks/zustand/overlay/hooks"
import { PostEditDialog } from "./PostEditDialog"

/**
 * Cap on the quoted-post snippet stashed for the composer. `QuotedPostCard` clamps to
 * three lines anyway, so anything past this is carried through the overlay store to be
 * thrown away on screen.
 */
const QUOTE_SNIPPET_MAX = 280

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
    /**
     * Pin the comment composer to the bottom of the scrolling box around this body — for
     * the popup, where the whole dialog scrolls as one piece. Off on the detail page,
     * whose scrolling ancestor is the viewport.
     */
    stickyComposer?: boolean
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
    stickyComposer,
}: CommunityPostContentProps) => {
    const t = useTranslations("communityHub")
    const tCommon = useTranslations("common")
    const locale = useLocale()
    const { post, isLoading, error, mutate } = useQueryPostDetailSwr(postId)
    const { meta } = useQueryPostMetaSwr(postId)
    const reactPost = useMutateReactPostSwr()
    const submitComment = useMutateCreatePostCommentSwr()
    const { editPost, removePost } = useMutatePostOwnerActionsSwr()
    const { editComment, removeComment } = useMutateCommentActionsSwr()
    const submitReport = useMutateReportContentSwr()
    const acceptAnswer = useMutateAcceptAnswerSwr()
    const recordShare = useMutateSharePostSwr()
    const { openQuote } = useCommunityComposerOverlayState()
    const [deepLinked, setDeepLinked] = useState(false)
    const [isEditOpen, setEditOpen] = useState(false)
    const [isDeleteOpen, setDeleteOpen] = useState(false)
    const [isReportOpen, setReportOpen] = useState(false)
    const [isDeleting, setDeleting] = useState(false)
    const currentUser = useAppSelector((state) => state.user.user)

    const commentsRegionId = regionId ?? `post-comments-${postId}`

    /**
     * Body actually rendered: `<https://…>` unwrapped to a bare url so the reader
     * shows `https://…` (a real `<a>` either way — GFM autolinks the bare form)
     * instead of the authored angle brackets, plus the FIRST link in the post —
     * the one, and only one, the preview card unfurls.
     */
    const rawBody = post?.body ?? ""
    const renderedBody = useMemo(() => unwrapAutolinks(rawBody), [rawBody])
    const previewUrl = useMemo(() => firstLinkUrl(rawBody), [rawBody])

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

    // A FAILED read is not a slow one. This used to be a single `!post` branch, so an
    // expired session, a deleted post or a dropped connection all rendered the loading
    // fallback — forever, with no way back. The reader saw a spinner that never resolved
    // and nobody could tell "still fetching" from "already dead". Ask the hook which it is:
    // it has always returned `error`/`isLoading`, they were simply never read.
    if (error && !post) {
        return (
            <CommentLoadError
                error={error}
                onRetry={() => {
                    void mutate()
                }}
            />
        )
    }
    if (isLoading || !post) {
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
                        frameCode={post.authorFrame}
                        hideName
                        size="sm"
                        className="size-9"
                        classNames={{ avatar: "size-9" }}
                    />
                }
                author={
                    <UserLink
                        username={post.authorUsername}
                        displayName={authorName}
                        showAvatar={false}
                        staffRole={post.authorStaffRole}
                        achievement={post.authorAchievement}
                        // Tên tác giả ĐẬM + màu chữ chính (mặc định `font-semibold` của UserLink
                        // đọc còn mảnh) — khớp với hàng tên ở feed.
                        classNames={{ name: "font-bold text-foreground" }}
                    />
                }
                timeLabel={post.timeLabel}
                threadline={commentsCount > 0}
            >
                {/* Bài kiểu Threads không có tiêu đề (tác giả không đánh H1) → không render khối
                    heading, nếu không dòng đầu của thân bài sẽ bị in lặp ngay bên trên nó. */}
                {post.title ? (
                    <Typography type="h5" weight="bold">
                        {post.title}
                    </Typography>
                ) : null}
                <MarkdownContent markdown={renderedBody} />
                {/* Bài ĐĂNG LẠI: card bài gốc lồng ngay dưới lời bình — cùng thứ tự với dòng feed,
                    để mở từ feed hay từ permalink đều thấy y hệt nhau. */}
                {post.quotedPost ? <QuotedPostCard post={post.quotedPost} /> : null}
                {/* Bài BÌNH CHỌN: phương án + nút bỏ phiếu là một phần THÂN BÀI, không phải
                    khối rời — mở bài từ feed hay từ permalink đều phải thấy phương án, nếu
                    không bài chỉ còn mỗi câu hỏi trống. (`/community/poll` cũng bỏ phiếu
                    được, nhưng đó là danh sách, không thay được đường đọc theo từng bài.)
                    `CommunityPoll` tự lo loading/lỗi + vote. */}
                {meta?.postType === "POLL" ? <CommunityPoll postId={postId} /> : null}
                {previewUrl ? <LinkPreview url={previewUrl} /> : null}
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
                    // 🔁 ĐĂNG LẠI (góp ý #16). Feed đã có nút này từ lâu; trang chi tiết —
                    // đúng chỗ người ta đọc xong một bài và muốn chia sẻ lại — thì không,
                    // vì `PostEngagementBar` gác nút bằng `onRepost != null` và bề mặt này
                    // quên truyền handler. Cùng một `openQuote` với feed, nên bài trích dẫn
                    // ra giống hệt nhau dù bấm từ đâu.
                    onRepost={() =>
                        openQuote({
                            id: postId,
                            author: authorName,
                            authorUsername: post.authorUsername,
                            title: post.title,
                            snippet: renderedBody.slice(0, QUOTE_SNIPPET_MAX),
                        })
                    }
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
                    onToggleCommentLike={toggleCommentReaction}
                    autoFocus={deepLinked}
                    stickyComposerOnMobile
                    stickyComposer={stickyComposer}
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
