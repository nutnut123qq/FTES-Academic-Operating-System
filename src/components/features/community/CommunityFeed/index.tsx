"use client"

import React, { useCallback, useState } from "react"
import { Typography } from "@heroui/react"
import { useLocale } from "next-intl"
import { Link } from "@/i18n/navigation"
import { PostEngagementBar } from "@/components/reuseable/PostEngagementBar"
import { PostCommentThread } from "@/components/reuseable/PostCommentThread"
import { useQueryCommunityFeedSwr, type CommunityPost } from "../hooks/useQueryCommunityFeedSwr"
import { useQueryPostCommentsSwr } from "../hooks/useQueryPostDetailSwr"
import { useMutateReactPostSwr } from "../hooks/useMutateReactPostSwr"
import { useMutateCreatePostCommentSwr, type SubmitCommentInput } from "../hooks/useMutateCreatePostCommentSwr"

/** One community feed row + its inline (lazy) comment thread. */
const CommunityFeedRow = ({ post }: { post: CommunityPost }) => {
    const locale = useLocale()
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
                justNowLabel: locale === "vi" ? "vừa xong" : "just now",
                parentCommentId,
            }
            return submitComment(input)
        },
        [post.id, locale, submitComment],
    )

    return (
        <div className="flex flex-col rounded-large border border-separator">
            <Link
                href={`/community/${post.id}`}
                className="flex flex-col gap-2 p-4 no-underline transition-colors hover:bg-default/40"
            >
                <div className="flex items-center gap-3">
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-accent/10 text-xs font-bold text-accent">
                        {post.author.slice(0, 1).toUpperCase()}
                    </div>
                    <Typography type="body-sm" weight="medium">
                        {post.author}
                    </Typography>
                    <Typography type="body-xs" color="muted">
                        {post.timeLabel}
                    </Typography>
                </div>
                <Typography type="body" weight="medium">
                    {post.title}
                </Typography>
                <Typography type="body-sm" color="muted">
                    {post.snippet}
                </Typography>
                <PostEngagementBar
                    className="pt-1"
                    likes={post.likes}
                    liked={post.liked}
                    commentsCount={post.comments}
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
            </Link>
            {/* SIBLING of the link — never a descendant, so thread clicks never navigate */}
            {expanded ? (
                <div className="px-4 pb-4">
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
                </div>
            ) : null}
        </div>
    )
}

/**
 * Community feed (§6). Post rows (author + time + title + snippet) with a shared
 * Threads-style engagement bar (like · comment · share · save) and inline
 * push-down comment expansion. The title/row link still navigates to the detail;
 * the bar's buttons never do. ponytail: rows hand-rolled; mock data.
 */
export const CommunityFeed = () => {
    const { posts } = useQueryCommunityFeedSwr()

    return (
        <div className="flex flex-col gap-3">
            {posts.map((post) => (
                <CommunityFeedRow key={post.id} post={post} />
            ))}
        </div>
    )
}
