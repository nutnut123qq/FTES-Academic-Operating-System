"use client"

import React, { useCallback, useState } from "react"
import { Button, Typography } from "@heroui/react"
import { PushPinIcon } from "@phosphor-icons/react"
import { useLocale, useTranslations } from "next-intl"
import { useParams } from "next/navigation"
import { useAppSelector } from "@/redux/hooks"
import { UserLink } from "@/components/features/identity"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import { Skeleton } from "@/components/blocks/skeleton/Skeleton"
import { PostEngagementBar } from "@/components/reuseable/PostEngagementBar"
import { PostCommentThread } from "@/components/reuseable/PostCommentThread"
import { useQueryGroupSwr } from "../hooks/useQueryGroupSwr"
import { useQueryGroupFeedSwr, type GroupPost } from "../hooks/useQueryGroupFeedSwr"
import {
    useComposeGroupPostComment,
    useQueryGroupPostCommentsSwr,
} from "../hooks/useQueryGroupPostCommentsSwr"
import { useMutateReactGroupPostSwr } from "../hooks/useMutateReactGroupPostSwr"
import { useMutateGroupPinnedSwr } from "../hooks/useMutateGroupPinnedSwr"

/** One group feed post card + its inline (lazy) comment thread. */
const GroupFeedCard = ({
    groupId,
    post,
    canPin,
}: {
    groupId: string
    post: GroupPost
    canPin: boolean
}) => {
    const t = useTranslations("groupsHub")
    const locale = useLocale()
    const [expanded, setExpanded] = useState(false)
    const [hasOpened, setHasOpened] = useState(false)
    const reactPost = useMutateReactGroupPostSwr(groupId)
    const { pin } = useMutateGroupPinnedSwr(groupId)
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

    // real compose: POST /community/posts/{postId}/comments then revalidate the thread
    const onSubmit = useComposeGroupPostComment(groupId, post.id, mutate)

    return (
        <div className="flex flex-col rounded-2xl border border-separator transition-colors hover:bg-default/40">
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
                    {/* pin this post (real endpoint, idempotent PUT) — surfaces in the
                        Manage tab's Pinned section. Owner-only: pinPost is an admin
                        endpoint, so hide the affordance from non-owner viewers. */}
                    {canPin ? (
                        <Button
                            isIconOnly
                            size="sm"
                            variant="ghost"
                            aria-label={t("feed.pin")}
                            className="ml-auto shrink-0"
                            onPress={() => void pin(post.id)}
                        >
                            <PushPinIcon className="size-4" />
                        </Button>
                    ) : null}
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

/** Loading skeleton — mirrors the feed card (avatar + author + body + action row). */
const GroupFeedSkeleton = () => (
    <div className="flex flex-col gap-3">
        {[0, 1, 2].map((index) => (
            <div key={index} className="flex flex-col gap-2 rounded-2xl border border-separator p-4">
                <div className="flex items-center gap-3">
                    <Skeleton.Avatar size="sm" className="shrink-0" />
                    <Skeleton.Typography type="body-sm" width="1/4" />
                </div>
                <Skeleton.Typography type="body-sm" width="full" />
                <Skeleton.Typography type="body-sm" width="3/4" />
                <Skeleton.Typography type="body-xs" width="1/4" />
            </div>
        ))}
    </div>
)

/**
 * Group feed (§7). Group post cards with the shared engagement bar (full bar:
 * like · comment · share · save) and inline push-down comment expansion. Engagement
 * (likes/comments) + comment thread are wired to the real BE (change
 * group-social-engagement): the feed slice carries live counters and comments go
 * through the community comment endpoints.
 */
export const GroupFeed = () => {
    const t = useTranslations("groupsHub")
    const { groupId } = useParams<{ groupId: string }>()
    const { posts, isLoading, error, mutate } = useQueryGroupFeedSwr(groupId)
    const { group } = useQueryGroupSwr(groupId)
    const currentUserId = useAppSelector((state) => state.user.user?.id)
    // pinPost is an admin endpoint — only the group owner may pin
    const canPin = group != null && currentUserId != null && group.ownerId === currentUserId

    return (
        <AsyncContent
            isLoading={isLoading && posts.length === 0}
            skeleton={<GroupFeedSkeleton />}
            isEmpty={posts.length === 0}
            emptyContent={{ title: t("feed.empty") }}
            error={posts.length === 0 ? error : undefined}
            errorContent={{
                title: t("feed.error"),
                onRetry: () => void mutate(),
                retryLabel: t("states.retry"),
            }}
        >
            <div className="flex flex-col gap-3">
                {posts.map((post) => (
                    <GroupFeedCard key={post.id} groupId={groupId} post={post} canPin={canPin} />
                ))}
            </div>
        </AsyncContent>
    )
}
