"use client"

import React, { useCallback, useState } from "react"
import { Button, Skeleton, Typography } from "@heroui/react"
import { useLocale, useTranslations } from "next-intl"
import { useAppSelector } from "@/redux/hooks"
import { Link } from "@/i18n/navigation"
import { UserLink } from "@/components/features/identity"
import { ThreadsPostRow } from "@/components/blocks/feed/ThreadsPostRow"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import { PostEngagementBar } from "@/components/reuseable/PostEngagementBar"
import { PostCommentThread } from "@/components/reuseable/PostCommentThread"
import { useCommunityComposerOverlayState } from "@/hooks/zustand/overlay/hooks"
import {
    useQueryCommunityFeedSwr,
    type CommunityFeedTab,
    type CommunityPost,
} from "../hooks/useQueryCommunityFeedSwr"
import { useQueryPostCommentsSwr } from "../hooks/useQueryPostDetailSwr"
import { useMutateReactPostSwr } from "../hooks/useMutateReactPostSwr"
import { useMutateCreatePostCommentSwr, type SubmitCommentInput } from "../hooks/useMutateCreatePostCommentSwr"

/** Composer trigger row — avatar + ghost "Có gì mới?" prompt + Đăng button. */
const ComposerTrigger = () => {
    const t = useTranslations("communityHub")
    const { open } = useCommunityComposerOverlayState()

    return (
        <div className="flex items-center gap-3 px-4 py-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent/10 text-sm font-bold text-accent">
                {t("engagement.you").slice(0, 1).toUpperCase()}
            </div>
            {/* the prompt is a real button; the Đăng button is a SIBLING (no nested interactive) */}
            <button
                type="button"
                className="min-w-0 flex-1 cursor-text text-left text-sm text-muted"
                onClick={open}
            >
                {t("composer.whatsNew")}
            </button>
            <Button size="sm" variant="secondary" className="shrink-0" onPress={open}>
                {t("composer.submit")}
            </Button>
        </div>
    )
}

/** Loading skeleton — mirrors the Threads post-row anatomy so the feed never jumps. */
const FeedSkeleton = () => (
    <div className="flex flex-col divide-y divide-separator">
        {[0, 1, 2].map((index) => (
            <div key={index} className="px-4 py-3">
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

/** One community feed row + its inline (lazy) comment thread. */
const CommunityFeedRow = ({ post }: { post: CommunityPost }) => {
    const locale = useLocale()
    const currentUser = useAppSelector((state) => state.user.user)
    const [expanded, setExpanded] = useState(false)
    const [hasOpened, setHasOpened] = useState(false)
    const reactPost = useMutateReactPostSwr()
    const submitComment = useMutateCreatePostCommentSwr()
    const { post: detail, isLoading, error, mutate } = useQueryPostCommentsSwr(post.id, hasOpened)

    const regionId = `post-comments-${post.id}`
    const postUrl =
        typeof window !== "undefined" ? `${window.location.origin}/${locale}/community/${post.id}` : ""

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
        [post.id, locale, submitComment],
    )

    return (
        <div className="px-4 py-3 transition-colors hover:bg-default/40">
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
                threadline={expanded}
            >
                {/* only the title + snippet navigate; actions keep their own press */}
                {/* Threads reads as ONE text block: title = first emphasized line, body
                    continues in foreground (not muted snippet) */}
                <Link href={`/community/${post.id}`} className="flex flex-col gap-0 no-underline">
                    <Typography type="body-sm" weight="medium">
                        {post.title}
                    </Typography>
                    <Typography type="body-sm">{post.snippet}</Typography>
                </Link>
                <PostEngagementBar
                    likes={post.likes}
                    liked={post.liked}
                    commentsCount={post.comments}
                    hideZeroCounts
                    onToggleLike={() => void reactPost(post.id, !post.liked)}
                    onToggleComments={onToggleComments}
                    commentsExpanded={expanded}
                    commentsRegionId={regionId}
                    postUrl={postUrl}
                    shareTitle={post.title}
                    saveEntityType="post"
                    saveEntityId={post.id}
                    saveSource={{ kind: "community", label: post.author }}
                />
                {expanded ? (
                    <PostCommentThread
                        regionId={regionId}
                        comments={detail?.comments ?? []}
                        isLoading={isLoading && !detail}
                        hasError={!detail ? Boolean(error) : false}
                        onRetry={() => void mutate()}
                        onSubmit={onSubmit}
                        onCollapse={onToggleComments}
                        stickyComposerOnMobile
                    />
                ) : null}
            </ThreadsPostRow>
        </div>
    )
}

/**
 * Community feed (§6), Threads-style. The composer trigger row ("Có gì mới?" →
 * modal composer) and post rows sit FLAT on the page — no card fill, no border,
 * no rounding — separated only by hairline dividers (`divide-separator`), so the
 * whole feed sinks into the page instead of reading as a white panel. Each row
 * uses the `ThreadsPostRow` anatomy (48px avatar column + content column) with
 * the shared engagement bar (zero counts suppressed) and inline push-down
 * comment expansion; a threadline connects the avatar to the expanded thread.
 * ponytail: mock data.
 */
export const CommunityFeed = ({ tab = "forYou" }: { tab?: CommunityFeedTab } = {}) => {
    const t = useTranslations("communityHub")
    const { posts, isLoading, error, mutate } = useQueryCommunityFeedSwr(tab)

    return (
        <div className="flex flex-col divide-y divide-separator">
            <ComposerTrigger />
            <AsyncContent
                isLoading={isLoading && posts.length === 0}
                skeleton={<FeedSkeleton />}
                isEmpty={posts.length === 0}
                emptyContent={{ title: t("feed.empty") }}
                error={posts.length === 0 ? error : undefined}
                errorContent={{
                    title: t("feed.error"),
                    onRetry: () => void mutate(),
                    retryLabel: t("states.retry"),
                }}
            >
                <div className="flex flex-col divide-y divide-separator">
                    {posts.map((post) => (
                        <CommunityFeedRow key={post.id} post={post} />
                    ))}
                </div>
            </AsyncContent>
        </div>
    )
}
