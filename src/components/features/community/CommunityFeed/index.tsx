"use client"

import React, { useCallback, useEffect, useMemo, useState } from "react"
import { Button, Modal, Popover, Skeleton, Spinner, Typography, cn, toast } from "@heroui/react"
import { MagnifyingGlassIcon } from "@phosphor-icons/react"
import { useLocale, useTranslations } from "next-intl"
import { useAppSelector } from "@/redux/hooks"
import { Link } from "@/i18n/navigation"
import { FtesMascot } from "@/components/reuseable/FtesMascot"
import { UserAvatar } from "@/components/reuseable/UserAvatar"
import { UserLink, useQueryFollowedUserIdsSwr } from "@/components/features/identity"
import { ThreadsPostRow } from "@/components/blocks/feed/ThreadsPostRow"
import { PostMediaGrid } from "@/components/blocks/feed/PostMediaGrid"
import { PinnedBadge } from "@/components/blocks/feed/PinnedBadge"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import { InfiniteScrollSentinel } from "@/components/blocks/async/InfiniteScrollSentinel"
import {
    ConfirmDialog,
    PostEngagementBar,
    ReportDialog,
    type EngagementActions,
    type ReportReasonCode,
} from "@/components/reuseable/PostEngagementBar"
import { PostCommentThread } from "@/components/reuseable/PostCommentThread"
import { toggleCommentReaction } from "@/modules/api/rest/community"
import { useCommunityComposerOverlayState } from "@/hooks/zustand/overlay/hooks"
import { useRequireAuth } from "@/hooks/useRequireAuth"
import {
    useQueryCommunityFeedSwr,
    type CommunityFeedTab,
    type CommunityPost,
} from "../hooks/useQueryCommunityFeedSwr"
import {
    useQueryCommunitySearchSwr,
    CommunitySearchSort,
} from "../hooks/useQueryCommunitySearchSwr"
import { CommunityFilterBar } from "../CommunityFilterBar"
import { useQueryPostCommentsSwr } from "../hooks/useQueryPostDetailSwr"
import { useMutateReactPostSwr } from "../hooks/useMutateReactPostSwr"
import { useMutateCreatePostCommentSwr, type SubmitCommentInput } from "../hooks/useMutateCreatePostCommentSwr"
import { useQueryPostMetaSwr } from "../CommunityPostDetail/hooks/useQueryPostMetaSwr"
import { useMutateReportContentSwr } from "../CommunityPostDetail/hooks/useMutateReportContentSwr"
import { PostEditDialog } from "../CommunityPostDetail/PostEditDialog"
import { CommunityPostContent } from "../CommunityPostDetail/CommunityPostContent"
import { useMutateFeedPostOwnerActionsSwr } from "./hooks/useMutateFeedPostOwnerActionsSwr"

/** Props for {@link CommunityFeedHeader} — the search/filter state it relocates into the popover. */
interface CommunityFeedHeaderProps {
    query: string
    onQueryChange: (query: string) => void
    sort: CommunitySearchSort
    onSortChange: (sort: CommunitySearchSort) => void
    postType: string
    onPostTypeChange: (postType: string) => void
    /** Whether the Newest/Oldest control is meaningful here — hidden on the TRENDING tab. */
    showSortControl: boolean
}

/**
 * Compact, Threads-style feed header on ONE row:
 * `[current-user avatar] [ "Có gì mới?" → opens the composer ] [🔍 → search popover]`,
 * rendered as its OWN card (surface fill + border + rounding + light shadow) so the
 * "post something" entry point reads as a distinct surface above the "Bảng tin" list
 * instead of blending into the rows.
 *
 * There is NO separate "Đăng" button here: pressing the prompt already opens the
 * composer, so the button only duplicated it (the real submit lives inside
 * `CommunityComposerForm`).
 *
 * The whole search + type-filter + sort cluster no longer sits always-visible in the feed — it is
 * collapsed behind the magnifier, which opens the shared {@link CommunityFilterBar} inside a HeroUI
 * {@link Popover} anchored under the icon. The popover is wired to the SAME search state/handlers
 * the parent {@link CommunityFeed} owns (nothing about filtering changes — only where the controls
 * live), and the icon carries a small accent dot whenever a keyword / type filter / non-default sort
 * is applied so the collapsed state stays legible.
 *
 * The avatar is the CURRENT user's (Redux `user.user`, same source as the navbar account avatar via
 * {@link UserAvatar}); it falls back to a generated/initials face for guests or when no avatar URL
 * is set.
 */
const CommunityFeedHeader = ({
    query,
    onQueryChange,
    sort,
    onSortChange,
    postType,
    onPostTypeChange,
    showSortControl,
}: CommunityFeedHeaderProps) => {
    const t = useTranslations("communityHub")
    const { open } = useCommunityComposerOverlayState()
    const user = useAppSelector((state) => state.user.user)

    // Filters are "applied" when a keyword, a post-type, or a non-default sort is set — drives the
    // dot indicator + the a11y label so the collapsed magnifier still announces active filtering.
    // A non-default sort only counts where the control is shown (Trending sort is hidden/ignored).
    const filtersActive =
        query.trim().length > 0 ||
        postType !== "" ||
        (showSortControl && sort !== CommunitySearchSort.Newest)

    return (
        // ponytail: composer = card riêng (nền surface + viền + bo góc + shadow) để nó nổi hẳn
        // khỏi danh sách bài, thay vì chìm vào hàng divider của feed.
        <div className="flex items-center gap-3 rounded-2xl border border-default bg-surface px-4 py-4 shadow-sm">
            <UserAvatar
                size="sm"
                className="size-9 shrink-0"
                username={user?.username}
                avatar={user?.avatar}
                seed={user?.email ?? user?.username}
            />
            {/* the prompt is a real button; the search button is a SIBLING (no nested interactive) */}
            <button
                type="button"
                className="min-w-0 flex-1 cursor-text text-left text-sm text-muted"
                onClick={open}
            >
                {t("composer.whatsNew")}
            </button>
            <Popover>
                <Popover.Trigger>
                    <Button
                        isIconOnly
                        size="sm"
                        variant="ghost"
                        className="shrink-0"
                        aria-label={filtersActive ? t("search.openActive") : t("search.open")}
                    >
                        <span className="relative inline-flex">
                            <MagnifyingGlassIcon aria-hidden focusable="false" className="size-5" />
                            {filtersActive ? (
                                <span
                                    aria-hidden
                                    className="absolute -right-0.5 -top-0.5 size-2 rounded-full bg-accent ring-2 ring-background"
                                />
                            ) : null}
                        </span>
                    </Button>
                </Popover.Trigger>
                <Popover.Content
                    placement="bottom end"
                    className={cn("w-[calc(100vw-2rem)] p-0 sm:w-[26rem]")}
                >
                    <CommunityFilterBar
                        query={query}
                        onQueryChange={onQueryChange}
                        sort={sort}
                        onSortChange={onSortChange}
                        postType={postType}
                        onPostTypeChange={onPostTypeChange}
                        showSortControl={showSortControl}
                    />
                </Popover.Content>
            </Popover>
        </div>
    )
}

/**
 * Loading skeleton — mirrors the post CARD anatomy so the feed never jumps.
 *
 * Exported because the subject workspace "Thảo luận" tab renders the SAME
 * {@link CommunityFeedRow}: một bản sao riêng bên đó sẽ đứng im khi giải phẫu card ở đây đổi,
 * và tab môn nhấp nháy khung cũ rồi vẽ lại khung mới — đúng cú giật khối này sinh ra để chặn.
 */
export const FeedSkeleton = () => (
    <div className="flex flex-col gap-3">
        {[0, 1, 2].map((index) => (
            <div
                key={index}
                className="rounded-2xl border border-default bg-surface px-4 py-3 shadow-sm"
            >
                <div className="grid grid-cols-[48px_minmax(0,1fr)] gap-x-2">
                    <Skeleton className="size-9 rounded-full" />
                    <div className="flex min-w-0 flex-col gap-2">
                        <Skeleton className="h-3 w-32 rounded-full" />
                        <Skeleton className="h-3 w-full rounded-full" />
                        <Skeleton className="h-3 w-3/4 rounded-full" />
                        <Skeleton className="h-4 w-24 rounded-full" />
                    </div>
                </div>
            </div>
        ))}
    </div>
)

/**
 * One community feed row + its inline (lazy) comment thread, with the SAME ⋯
 * overflow menu the detail page has: "Sửa"/"Xoá" for the author, "Báo cáo" for
 * everyone else. Both dialogs and every write are the shared detail-page ones
 * ({@link PostEditDialog} / {@link ConfirmDialog} / {@link ReportDialog} over
 * {@link useMutateFeedPostOwnerActionsSwr}, which wraps the shared owner hook) —
 * the feed adds only the row-level optimistic removal.
 *
 * `isFollowing` comes from the PAGE-level batch read (see {@link CommunityFeed}) —
 * the row never asks for it itself, so a feed of 20 authors costs one request
 * instead of one per hovered avatar.
 *
 * Exported for unit tests: rendering ONE row pins the owner gate without
 * standing up the whole paginated feed.
 */
export const CommunityFeedRow = ({
    post,
    isFollowing,
    actions,
}: {
    post: CommunityPost
    /** Whether the viewer already follows this author; `undefined` = not read yet. */
    isFollowing?: boolean
    /**
     * Which engagement buttons the bar renders. `undefined` (the default, and what
     * `/community` passes) keeps the FULL bar — like + comment + share + save. A surface
     * with a narrower contract hands its own preset down: the subject workspace "Thảo luận"
     * tab passes `DISCUSSION_ENGAGEMENT_ACTIONS` (like + comment ONLY), which is the
     * decision recorded in `PostEngagementBar/actions.ts` and also keeps the repost flow —
     * it navigates to `/community/{id}` — from throwing the reader out of the subject.
     */
    actions?: EngagementActions
}) => {
    const t = useTranslations("communityHub")
    const tCommon = useTranslations("common")
    const locale = useLocale()
    const currentUser = useAppSelector((state) => state.user.user)
    const [expanded, setExpanded] = useState(false)
    const [hasOpened, setHasOpened] = useState(false)
    // ponytail: "mở bài" = modal tại chỗ (kiểu Facebook), state cục bộ của row — không cần
    // overlay store toàn cục vì chỉ đúng row đang bấm mới phải biết.
    const [isPostOpen, setPostOpen] = useState(false)
    const [isEditOpen, setEditOpen] = useState(false)
    const [isDeleteOpen, setDeleteOpen] = useState(false)
    const [isReportOpen, setReportOpen] = useState(false)
    const reactPost = useMutateReactPostSwr()
    const submitComment = useMutateCreatePostCommentSwr()
    const { openQuote } = useCommunityComposerOverlayState()
    const { guard } = useRequireAuth()
    const { deleteFeedPost, editFeedPost } = useMutateFeedPostOwnerActionsSwr()
    const submitReport = useMutateReportContentSwr()
    const { post: detail, isLoading, error, mutate } = useQueryPostCommentsSwr(post.id, hasOpened)
    // The feed row carries a truncated `snippet`, never the raw markdown, so the
    // editor prefill needs the REST metadata — fetched only once "Sửa" is picked
    // (a key per row would be one request per row on every feed page).
    const { meta, error: metaError } = useQueryPostMetaSwr(isEditOpen ? post.id : "")

    const regionId = `post-comments-${post.id}`
    const postUrl =
        typeof window !== "undefined" ? `${window.location.origin}/${locale}/community/${post.id}` : ""
    /**
     * Name actually rendered. The mapper leaves `author` empty when the BE row carried no
     * profile card, and `UserLink` would then fall back to `username` — which on those rows
     * is the raw author id. One shared label keeps a uuid off the card.
     */
    const authorName = post.author || tCommon("unknownMember")

    const onToggleComments = useCallback(() => {
        setHasOpened(true)
        setExpanded((prev) => !prev)
    }, [])

    const onSubmit = useCallback(
        async (body: string, parentCommentId?: string): Promise<boolean> => {
            const input: SubmitCommentInput = {
                postId: post.id,
                body,
                authorLabel: locale === "vi" ? "Bạn" : "You",
                authorUsername: currentUser?.username ?? "you",
                justNowLabel: locale === "vi" ? "vừa xong" : "just now",
                parentCommentId,
            }
            return submitComment(input)
        },
        [post.id, locale, submitComment, currentUser],
    )

    /**
     * Owner gate. Prefers the author id (BE `Post.authorId`, now in the feed
     * selection) because a display name / username can be missing on the card while
     * the id is always present; the username comparison stays as the fallback for
     * surfaces whose selection has no id yet. Guests match nothing, and the server
     * re-checks ownership on the write anyway (403).
     */
    const isOwner = Boolean(
        (currentUser?.id && post.authorId && post.authorId === currentUser.id) ||
            (currentUser?.username && post.authorUsername === currentUser.username),
    )

    // The metadata request backs the editor prefill; losing it would mean saving
    // the truncated snippet over the real body, so the editor stays shut.
    useEffect(() => {
        if (isEditOpen && metaError) {
            toast.danger(t("engagement.editLoadFailed"))
            setEditOpen(false)
        }
    }, [isEditOpen, metaError, t])

    /**
     * Confirming closes the dialog straight away: the removal is optimistic, so
     * the row (and this dialog with it) is gone before the DELETE resolves —
     * a pending state would only ever flash. A failed write rolls the row back
     * and the shared hook toasts the real reason.
     */
    const onConfirmDelete = useCallback(() => {
        setDeleteOpen(false)
        void deleteFeedPost(post.id)
    }, [post.id, deleteFeedPost])

    const onReportPost = useCallback(
        (reasonCode: ReportReasonCode, detailText?: string) =>
            submitReport("POST", post.id, reasonCode, detailText),
        [post.id, submitReport],
    )

    return (
        // ponytail: mỗi bài = 1 CARD (surface + viền + bo góc + shadow nhẹ) thay cho hàng
        // dính liền chỉ cách nhau bằng đường kẻ; khoảng cách giữa các card do parent `gap-3` lo.
        <div className="rounded-2xl border border-default bg-surface px-4 py-3 shadow-sm transition-colors hover:bg-default/40">
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
                        isFollowing={isFollowing}
                    />
                }
                author={
                    <UserLink
                        username={post.authorUsername}
                        displayName={authorName}
                        showAvatar={false}
                        staffRole={post.authorStaffRole}
                        isFollowing={isFollowing}
                        // Tên tác giả phải ĐẬM và ăn màu chữ chính — mặc định của UserLink là
                        // `font-semibold`, đọc trên nền card vẫn mảnh so với thân bài.
                        classNames={{ name: "font-bold text-foreground" }}
                    />
                }
                timeLabel={post.timeLabel}
                threadline={expanded}
            >
                {/* only the title + snippet navigate; actions keep their own press */}
                {/* Threads reads as ONE text block: title = first emphasized line, body
                    continues in foreground (not muted snippet) */}
                {/* Bài admin ghim — CHỈ là nhãn: BE đã đẩy bài ghim lên đầu trang đầu,
                    tuyệt đối không sắp xếp lại phía FE theo cờ này. */}
                {post.pinned ? <PinnedBadge label={t("feed.pinned")} className="mb-1" /> : null}
                {/* ponytail: vẫn là <Link href> thật — deep link /community/<id>, mở tab mới bằng
                    ctrl/⌘/chuột giữa và crawler đều còn nguyên; chỉ cú click THƯỜNG bị chặn điều
                    hướng để mở modal chi tiết tại chỗ (kiểu Facebook). */}
                <Link
                    href={`/community/${post.id}`}
                    className="flex flex-col gap-0 no-underline"
                    onClick={(event) => {
                        if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
                            return
                        }
                        event.preventDefault()
                        setPostOpen(true)
                    }}
                >
                    {/* Bài không có tiêu đề (tác giả không đánh H1) → chỉ còn snippet. Render khối
                        đậm vô điều kiện là in dòng đầu hai lần trên đúng những bài ngắn nhất. */}
                    {post.title ? (
                        <Typography type="body-sm" weight="medium">
                            {post.title}
                        </Typography>
                    ) : null}
                    <Typography type="body-sm">{post.snippet}</Typography>
                </Link>
                <PostMediaGrid postId={post.id} media={post.media} imageAlt={t("composer.imageAlt")} />
                <PostEngagementBar
                    actions={actions}
                    likes={post.likes}
                    liked={post.liked}
                    commentsCount={post.comments}
                    hideZeroCounts
                    onToggleLike={() => void reactPost(post.id, !post.liked)}
                    onToggleComments={onToggleComments}
                    // 🔁 chỉ có ở bề mặt cho phép share. `PostEngagementBar` gác nút repost bằng
                    // `onRepost != null` chứ KHÔNG đọc `actions.share` (mọi bề mặt khác đang dựa
                    // vào đúng hành vi đó), nên bề mặt tắt share phải tự không truyền handler —
                    // bằng không tab "Thảo luận" của môn vẫn hiện 🔁, và một lượt đăng lại sẽ
                    // đẩy người đọc thẳng ra /community.
                    onRepost={
                        actions?.share === false
                            ? undefined
                            : () =>
                                openQuote({
                                    id: post.id,
                                    author: authorName,
                                    authorUsername: post.authorUsername,
                                    title: post.title,
                                    snippet: post.snippet,
                                })
                    }
                    commentsExpanded={expanded}
                    commentsRegionId={regionId}
                    postUrl={postUrl}
                    shareTitle={post.title}
                    isOwner={isOwner}
                    onEdit={() => setEditOpen(true)}
                    onDelete={() => setDeleteOpen(true)}
                    onReport={guard(() => setReportOpen(true), "auth.context.generic")}
                    saveEntityType="post"
                    saveEntityId={post.id}
                    saveSource={{ kind: "community", label: authorName }}
                />
                {expanded ? (
                    <PostCommentThread
                        regionId={regionId}
                        comments={detail?.comments ?? []}
                        isLoading={isLoading && !detail}
                        hasError={!detail ? Boolean(error) : false}
                        // The read is viewer-scoped: the gateway answers a missing /
                        // expired token with a top-level 401 PLATFORM_UNAUTHORIZED, a
                        // private-group post with FORBIDDEN and a removed one with
                        // COMMUNITY_POST_NOT_FOUND. Hand the rejection over so the
                        // thread says WHICH of those happened instead of one blanket
                        // "Không tải được bình luận" + a retry that can never succeed
                        // (same distinction the feed-level `isAuthGate` above makes).
                        error={error}
                        onRetry={() => void mutate()}
                        onSubmit={onSubmit}
                        onToggleCommentLike={toggleCommentReaction}
                        onCollapse={onToggleComments}
                        stickyComposerOnMobile
                    />
                ) : null}
            </ThreadsPostRow>

            {/* Bài viết mở TẠI CHỖ trong modal (kiểu Facebook) — nội dung là chính
                {@link CommunityPostContent} mà trang /community/<id> và lightbox ảnh đang dùng,
                nên phần bình luận / engagement / quyền sở hữu không bao giờ lệch nhau.
                Esc + click nền đóng modal (mặc định HeroUI qua `onOpenChange`). */}
            <Modal
                isOpen={isPostOpen}
                onOpenChange={(open) => {
                    if (!open) {
                        setPostOpen(false)
                    }
                }}
            >
                <Modal.Backdrop>
                    <Modal.Container className="p-3 sm:p-6">
                        <Modal.Dialog className="max-h-[90vh] w-full max-w-2xl overflow-y-auto px-4">
                            <Modal.CloseTrigger aria-label={t("feed.closePost")} className="z-20" />
                            {isPostOpen ? (
                                <CommunityPostContent
                                    postId={post.id}
                                    regionId={`modal-post-comments-${post.id}`}
                                    commentsAnchorId={`modal-comments-${post.id}`}
                                    loadingFallback={
                                        <div className="flex items-center justify-center py-16">
                                            <Spinner aria-label={t("photoViewer.loading")} />
                                        </div>
                                    }
                                />
                            ) : null}
                        </Modal.Dialog>
                    </Modal.Container>
                </Modal.Backdrop>
            </Modal>

            {/* opens only once the raw title/body landed — see the metadata note above */}
            <PostEditDialog
                isOpen={isEditOpen && Boolean(meta)}
                onClose={() => setEditOpen(false)}
                title={meta?.title ?? post.title}
                content={meta?.content ?? ""}
                onSave={(input) => editFeedPost(post.id, input)}
            />

            <ConfirmDialog
                isOpen={isDeleteOpen}
                onClose={() => setDeleteOpen(false)}
                onConfirm={onConfirmDelete}
                title={t("engagement.deletePostTitle")}
                description={t("engagement.deletePostConfirm")}
            />

            <ReportDialog
                isOpen={isReportOpen}
                onClose={() => setReportOpen(false)}
                onSubmit={onReportPost}
            />
        </div>
    )
}

/**
 * Community feed (§6). Three stacked surfaces, spaced (no hairline dividers):
 * the composer trigger CARD ("Có gì mới?" → modal composer), the "Bảng tin"
 * heading, then one CARD PER POST (`bg-surface` + `border-default` + `rounded-2xl`
 * + light shadow — theme tokens, so dark mode follows). The rows used to sit flat
 * and glued together by `divide-separator`, which made the composer and the posts
 * read as one undifferentiated column.
 *
 * Clicking a row's title/body opens that post in a MODAL (Facebook-style) over the
 * feed rather than navigating away; the `/community/{postId}` route still renders
 * the same content for deep links and new-tab clicks — see {@link CommunityFeedRow}.
 *
 * Each row keeps the `ThreadsPostRow` anatomy (48px avatar column + content column) with
 * the shared engagement bar (zero counts suppressed) and inline push-down
 * comment expansion; a threadline connects the avatar to the expanded thread.
 * Every row carries the SAME ⋯ owner menu as the post detail page (see
 * {@link CommunityFeedRow}) — editing/deleting/reporting no longer requires
 * opening the post first.
 *
 * Data is the real BE GraphQL `feed(tab, page, campus)`, or `communitySearch` while a keyword
 * / filter is set. BOTH are cursor-paginated with `useSWRInfinite`, so the list keeps loading
 * pages through the `InfiniteScrollSentinel` until the BE stops returning a `nextCursor` —
 * there is no fixed first-page ceiling on either.
 *
 * Follow state for the authors on screen is read ONCE PER PAGE-SET
 * ({@link useQueryFollowedUserIdsSwr}) and pushed into every row, so the hovercard CTA
 * already says "Đang theo dõi" the first time it opens — and a toggle fired from any
 * row moves the whole feed, because the write patches both the batch lot and the
 * hovercard entry.
 */
export const CommunityFeed = ({ tab = "forYou" }: { tab?: CommunityFeedTab } = {}) => {
    const t = useTranslations("communityHub")
    const { open: openComposer } = useCommunityComposerOverlayState()
    // Guests get 401 from the viewer-scoped feed read — see `isAuthGate` below.
    const { authenticated, requireAuth } = useRequireAuth()

    // Search/filter state. Typing a keyword or choosing a filter switches to search mode (global,
    // all published posts) and replaces the tab feed; clearing everything returns to the tab feed.
    const [query, setQuery] = useState("")
    const [sort, setSort] = useState<CommunitySearchSort>(CommunitySearchSort.Newest)
    const [postType, setPostType] = useState("")
    // Debounce the keyword so the SWR key (and refetch) don't fire on every keystroke.
    const [debouncedQuery, setDebouncedQuery] = useState("")
    useEffect(() => {
        const id = setTimeout(() => setDebouncedQuery(query), 300)
        return () => clearTimeout(id)
    }, [query])

    const criteria = useMemo(
        () => ({ q: debouncedQuery, sort, postType }),
        [debouncedQuery, sort, postType],
    )
    const search = useQueryCommunitySearchSwr(criteria)
    // TRENDING is engagement-ordered by identity — it ignores the sort server-side and hides the
    // Newest/Oldest control (see CommunityFeedHeader). Feed the hook Newest there so its SWR key
    // stays stable regardless of the (hidden) sort state.
    const isTrending = tab === "trending"
    const feed = useQueryCommunityFeedSwr(tab, isTrending ? CommunitySearchSort.Newest : sort)

    // Search mode and the tab feed are BOTH cursor-paginated `useSWRInfinite` sources with the
    // same page shape, so the list/sentinel below reads from whichever one is active.
    const searching = search.active
    const source = searching ? search : feed
    const posts = source.posts
    const isLoading = source.isLoading
    const error = source.error
    const mutate = source.mutate
    const isLoadingMore = source.isLoadingMore
    const canLoadMore = source.hasMore
    const loadMore = () => void source.setSize((current) => current + 1)

    /**
     * Follow state for EVERY author currently on screen, in one read
     * (`GET /community/follows/me`) instead of one profile read per hovered avatar.
     * The hook dedupes + sorts the ids into a single cache entry and splits them into
     * `FOLLOW_BATCH_LIMIT`-sized lots itself, so a long infinite feed (the same author
     * repeated, or well past 100 distinct ones) stays correct without the row knowing
     * anything. Guests never fetch — the endpoint reads the caller's own edges.
     */
    const authorIds = useMemo(() => posts.map((post) => post.authorId), [posts])
    const { isFollowing } = useQueryFollowedUserIdsSwr(authorIds)

    // CAMPUS tab is scoped to the viewer's campus (BE falls back to the profile campus).
    // When empty it usually means the viewer hasn't set a campus on their profile, so the
    // empty state guides them there instead of showing the generic "be the first to post".
    const isCampus = tab === "campus"

    /**
     * The BE feed read is viewer-scoped, so a guest gets 401 `PLATFORM_UNAUTHORIZED`
     * rather than a public feed. That is an AUTH GATE, not a broken request — routing
     * it into the generic error state showed "Không tải được bảng tin" with a Retry
     * button that could never succeed. Detect the gate (duck-typed `status`, mirroring
     * `sectionStatusOf` in the subject-career hook, plus the platform error code that
     * the GraphQL gateway returns) and invite sign-in instead.
     */
    const isAuthGate =
        !authenticated &&
        Boolean(error) &&
        (() => {
            const status = (error as { status?: unknown } | null)?.status
            if (status === 401 || status === 403) return true
            return /PLATFORM_UNAUTHORIZED|401/.test(String((error as Error | null)?.message ?? ""))
        })()

    const emptyContent = isAuthGate
        ? {
            icon: <FtesMascot pose="explain" size="lg" />,
            title: t("feed.guestTitle"),
            description: t("feed.guestHint"),
            action: (
                <Button size="sm" variant="primary" onPress={() => requireAuth("auth.context.feed")}>
                    {t("feed.guestCta")}
                </Button>
            ),
        }
        : searching
            ? { title: t("search.resultsEmpty"), description: t("search.resultsEmptyHint") }
            : isCampus
                ? { title: t("feed.campusEmpty"), description: t("feed.campusEmptyHint") }
                : {
                    icon: <FtesMascot pose="explain" size="lg" />,
                    title: t("feed.empty"),
                    description: t("feed.emptyHint"),
                    action: (
                        <Button size="sm" variant="primary" onPress={openComposer}>
                            {t("feed.emptyCompose")}
                        </Button>
                    ),
                }

    return (
        <div className="flex flex-col gap-4">
            <CommunityFeedHeader
                query={query}
                onQueryChange={setQuery}
                sort={sort}
                onSortChange={setSort}
                postType={postType}
                onPostTypeChange={setPostType}
                showSortControl={!isTrending}
            />
            {/* Heading đứng NGOÀI AsyncContent: nó là nhãn của khu vực, phải còn khi danh sách
                rỗng / đang tải / lỗi — không phải một phần của dữ liệu. */}
            <Typography type="h5" weight="bold">
                {t("feed.heading")}
            </Typography>
            <AsyncContent
                isLoading={isLoading && posts.length === 0}
                skeleton={<FeedSkeleton />}
                isEmpty={posts.length === 0}
                emptyContent={emptyContent}
                error={posts.length === 0 && !isAuthGate ? error : undefined}
                errorContent={{
                    title: t("feed.error"),
                    onRetry: () => void mutate(),
                    retryLabel: t("states.retry"),
                }}
            >
                <div className="flex flex-col gap-3">
                    {posts.map((post) => (
                        <CommunityFeedRow
                            key={post.id}
                            post={post}
                            isFollowing={isFollowing(post.authorId)}
                        />
                    ))}
                </div>
                {canLoadMore ? (
                    <>
                        {isLoadingMore ? (
                            <div className="px-4 py-3" aria-hidden>
                                <Skeleton className="h-3 w-40 rounded-full" />
                            </div>
                        ) : null}
                        <InfiniteScrollSentinel
                            onReach={loadMore}
                            disabled={isLoadingMore}
                        />
                    </>
                ) : null}
            </AsyncContent>
        </div>
    )
}
