"use client"

import React, { useCallback, useState } from "react"
import { Button, Typography } from "@heroui/react"
import { useLocale, useTranslations } from "next-intl"
import { useParams } from "next/navigation"
import { useAppSelector } from "@/redux/hooks"
import { UserLink } from "@/components/features/identity"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import { Skeleton } from "@/components/blocks/skeleton/Skeleton"
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

/** One "Thảo luận" post row + inline comment thread. Like + comment ONLY. */
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
    const currentUser = useAppSelector((state) => state.user.user)
    const [expanded, setExpanded] = useState(false)
    const [hasOpened, setHasOpened] = useState(false)
    const reactPost = useMutateReactSubjectPostSwr(subjectId, scope)
    const { thread, isLoading, error, mutate } = useQuerySubjectPostCommentsSwr(
        subjectId,
        post.id,
        hasOpened,
        scope,
    )

    const regionId = `post-comments-${post.id}`

    const onToggleComments = useCallback(() => {
        setHasOpened(true)
        setExpanded((prev) => !prev)
    }, [])

    // Write (add comment) is still local-optimistic: the real BE `Post.comments` read
    // is wired, but there is no GraphQL mutation in this scope, so the new comment is
    // appended to the SWR cache until the next revalidation.
    const onSubmit = useCallback(
        async (body: string, parentCommentId?: string): Promise<boolean> => {
            await mutate((current) => {
                if (!current) {
                    return current
                }
                const optimistic = {
                    id: `tmp-${Date.now()}`,
                    author: locale === "vi" ? "Bạn" : "You",
                    authorUsername: currentUser?.username ?? "you",
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
        [mutate, locale, currentUser],
    )

    return (
        <div className="flex flex-col rounded-2xl border border-separator">
            <div className="flex flex-col gap-2 p-4">
                <div className="flex items-center gap-3">
                    <UserLink
                        username={post.authorUsername}
                        displayName={post.author}
                        hideName
                        size="sm"
                        classNames={{ avatar: "size-8" }}
                    />
                    <UserLink username={post.authorUsername} displayName={post.author} showAvatar={false} />
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
 * comment expansion. The feed read + like + comment read are wired to the real BE
 * (`subjectWorkspace.community` + community REST reactions); the add-comment write
 * stays local-optimistic here.
 */
export const SubjectCommunity = () => {
    const t = useTranslations("subjects")
    const { subjectId } = useParams<{ subjectId: string }>()
    const [scope, setScope] = useState<FeedScope>("forYou")
    const { posts, isLoading, error, mutate } = useQuerySubjectFeedSwr(subjectId, scope)

    return (
        <div className="flex flex-col gap-6 p-6">
            {/* scope filter — static chrome, stays outside the skeleton */}
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

            <AsyncContent
                isLoading={isLoading && posts.length === 0}
                skeleton={<FeedSkeleton />}
                isEmpty={posts.length === 0}
                emptyContent={{ title: t("community.empty") }}
                error={posts.length === 0 ? error : undefined}
                errorContent={{
                    title: t("community.loadError"),
                    onRetry: () => { void mutate() },
                    retryLabel: t("community.retry"),
                }}
            >
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
            </AsyncContent>
        </div>
    )
}

/** Loading skeleton — mirrors the discussion post rows. */
const FeedSkeleton = () => (
    <div className="flex flex-col gap-3">
        {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-32 w-full rounded-2xl" />
        ))}
    </div>
)
