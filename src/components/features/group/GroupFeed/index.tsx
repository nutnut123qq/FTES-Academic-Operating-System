"use client"

import React, { useCallback, useState } from "react"
import { Typography } from "@heroui/react"
import { useLocale } from "next-intl"
import { useParams } from "next/navigation"
import { PostEngagementBar } from "@/components/reuseable/PostEngagementBar"
import { PostCommentThread } from "@/components/reuseable/PostCommentThread"
import { useQueryGroupFeedSwr, type GroupPost } from "../hooks/useQueryGroupFeedSwr"
import { useQueryGroupPostCommentsSwr } from "../hooks/useQueryGroupPostCommentsSwr"
import { useMutateReactGroupPostSwr } from "../hooks/useMutateReactGroupPostSwr"

/** One group feed post card + its inline (lazy, mock) comment thread. */
const GroupFeedCard = ({ groupId, post }: { groupId: string; post: GroupPost }) => {
    const locale = useLocale()
    const [expanded, setExpanded] = useState(false)
    const [hasOpened, setHasOpened] = useState(false)
    const reactPost = useMutateReactGroupPostSwr(groupId)
    const { thread, isLoading, error, mutate } = useQueryGroupPostCommentsSwr(
        groupId,
        post.id,
        hasOpened,
    )

    const regionId = `post-comments-${post.id}`
    const postUrl =
        typeof window !== "undefined"
            ? `${window.location.origin}/${locale}/groups/${groupId}`
            : ""

    const onToggleComments = useCallback(() => {
        setHasOpened(true)
        setExpanded((prev) => !prev)
    }, [])

    // ponytail: mock BE — no group comment write contract. Append locally.
    const onSubmit = useCallback(
        async (body: string, parentCommentId?: string): Promise<boolean> => {
            await mutate((current) => {
                if (!current) {
                    return current
                }
                const optimistic = {
                    id: `tmp-${Date.now()}`,
                    author: locale === "vi" ? "Bạn" : "You",
                    text: body,
                    timeLabel: locale === "vi" ? "vừa xong" : "just now",
                }
                if (parentCommentId) {
                    return {
                        ...current,
                        comments: current.comments.map((comment) =>
                            comment.id === parentCommentId
                                ? { ...comment, replies: [...(comment.replies ?? []), optimistic] }
                                : comment,
                        ),
                    }
                }
                return { ...current, comments: [...current.comments, optimistic] }
            }, { revalidate: false })
            return true
        },
        [mutate, locale],
    )

    return (
        <div className="flex flex-col rounded-2xl border border-separator">
            <div className="flex flex-col gap-2 p-4">
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
                <Typography type="body-sm" color="muted">
                    {post.text}
                </Typography>
                <PostEngagementBar
                    className="pt-1"
                    likes={post.likes}
                    liked={post.liked}
                    commentsCount={post.comments}
                    onToggleLike={() => void reactPost(post.id)}
                    onToggleComments={onToggleComments}
                    commentsExpanded={expanded}
                    commentsRegionId={regionId}
                    postUrl={postUrl}
                    shareTitle={post.text}
                    saveEntityType="post"
                    saveEntityId={post.id}
                    saveSource={{ kind: "group", id: groupId, label: post.author }}
                />
            </div>
            {expanded ? (
                <div className="px-4 pb-4">
                    <PostCommentThread
                        regionId={regionId}
                        comments={thread?.comments ?? []}
                        isLoading={isLoading && !thread}
                        hasError={!thread ? Boolean(error) : false}
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
 * Group feed (§7). Group post cards with the shared engagement bar (full bar:
 * like · comment · share · save) and inline push-down comment expansion (mock
 * comments — no group-post BE contract). ponytail: mock data.
 */
export const GroupFeed = () => {
    const { groupId } = useParams<{ groupId: string }>()
    const { posts } = useQueryGroupFeedSwr(groupId)

    return (
        <div className="flex flex-col gap-3">
            {posts.map((post) => (
                <GroupFeedCard key={post.id} groupId={groupId} post={post} />
            ))}
        </div>
    )
}
