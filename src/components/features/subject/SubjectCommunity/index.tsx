"use client"

import React, { useCallback, useState } from "react"
import { Button, Typography } from "@heroui/react"
import { useLocale, useTranslations } from "next-intl"
import { useParams } from "next/navigation"
import {
    PostEngagementBar,
    DISCUSSION_ENGAGEMENT_ACTIONS,
} from "@/components/reuseable/PostEngagementBar"
import { PostCommentThread } from "@/components/reuseable/PostCommentThread"
import {
    useQuerySubjectFeedSwr,
    type FeedScope,
    type SubjectPost,
} from "../hooks/useQuerySubjectFeedSwr"
import { useQuerySubjectPostCommentsSwr } from "../hooks/useQuerySubjectPostCommentsSwr"
import { useMutateReactSubjectPostSwr } from "../hooks/useMutateReactSubjectPostSwr"

/** Feed scope tabs. */
const SCOPES: Array<FeedScope> = ["forYou", "following", "trending"]

/** One "Thảo luận" post row + inline (lazy, mock) comment thread. Like + comment ONLY. */
const SubjectPostRow = ({
    subjectId,
    scope,
    post,
}: {
    subjectId: string
    scope: FeedScope
    post: SubjectPost
}) => {
    const locale = useLocale()
    const [expanded, setExpanded] = useState(false)
    const [hasOpened, setHasOpened] = useState(false)
    const reactPost = useMutateReactSubjectPostSwr(subjectId, scope)
    const { thread, isLoading, error, mutate } = useQuerySubjectPostCommentsSwr(
        subjectId,
        post.id,
        hasOpened,
    )

    const regionId = `post-comments-${post.id}`

    const onToggleComments = useCallback(() => {
        setHasOpened(true)
        setExpanded((prev) => !prev)
    }, [])

    // ponytail: mock BE — no subject comment write contract. Append locally.
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
        <div className="flex flex-col rounded-large border border-separator">
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
                <Typography type="body" weight="medium">
                    {post.title}
                </Typography>
                <Typography type="body-sm" color="muted">
                    {post.snippet}
                </Typography>
                {/* discussion = like + comment ONLY — no share, no save */}
                <PostEngagementBar
                    className="pt-1"
                    actions={DISCUSSION_ENGAGEMENT_ACTIONS}
                    likes={post.reactions}
                    liked={post.liked}
                    commentsCount={post.comments}
                    onToggleLike={() => void reactPost(post.id)}
                    onToggleComments={onToggleComments}
                    commentsExpanded={expanded}
                    commentsRegionId={regionId}
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
 * Subject workspace "Thảo luận" tab (renamed by subject-workspace-ia). A scope
 * filter over post rows carrying the shared engagement bar configured for
 * DISCUSSION (like + comment ONLY — no share, no save) with inline push-down
 * comment expansion. ponytail: mock feed until the BE community query exists.
 */
export const SubjectCommunity = () => {
    const t = useTranslations("subjects")
    const { subjectId } = useParams<{ subjectId: string }>()
    const [scope, setScope] = useState<FeedScope>("forYou")
    const { posts } = useQuerySubjectFeedSwr(subjectId, scope)

    return (
        <div className="flex flex-col gap-6 p-6">
            <div className="flex flex-col gap-3">
                <Typography type="h5" weight="bold">
                    {t("community.title")}
                </Typography>
                <div className="flex flex-wrap gap-2">
                    {SCOPES.map((item) => (
                        <Button
                            key={item}
                            size="sm"
                            variant={scope === item ? "secondary" : "ghost"}
                            onPress={() => setScope(item)}
                        >
                            {t(`community.scopes.${item}`)}
                        </Button>
                    ))}
                </div>
            </div>

            <div className="flex flex-col gap-3">
                {posts.map((post) => (
                    <SubjectPostRow
                        key={post.id}
                        subjectId={subjectId}
                        scope={scope}
                        post={post}
                    />
                ))}
            </div>
        </div>
    )
}
