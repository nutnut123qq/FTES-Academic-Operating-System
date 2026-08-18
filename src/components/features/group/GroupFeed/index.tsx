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
import { toggleCommentReaction } from "@/modules/api/rest/community"
import { MarkdownContent } from "@/components/reuseable/MarkdownContent"
import { useQueryPostCommentsSwr } from "@/components/features/community/hooks/useQueryPostDetailSwr"
import {
    useMutateCreatePostCommentSwr,
    type SubmitCommentInput,
} from "@/components/features/community/hooks/useMutateCreatePostCommentSwr"
import { useQueryGroupSwr } from "../hooks/useQueryGroupSwr"
import { useQueryGroupFeedSwr, type GroupPost } from "../hooks/useQueryGroupFeedSwr"
import { useMutateReactGroupPostSwr } from "../hooks/useMutateReactGroupPostSwr"
import { useMutateGroupPinnedSwr } from "../hooks/useMutateGroupPinnedSwr"
import { GroupFeedComposer } from "./GroupFeedComposer"
import { groupPostPermalink } from "./permalink"

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
    const tCommon = useTranslations("common")
    const locale = useLocale()
    const currentUser = useAppSelector((state) => state.user.user)
    const [expanded, setExpanded] = useState(false)
    const [hasOpened, setHasOpened] = useState(false)
    const reactPost = useMutateReactGroupPostSwr(groupId)
    const { pin } = useMutateGroupPinnedSwr(groupId)
    const submitComment = useMutateCreatePostCommentSwr()
    /**
     * A group post IS a community post, so its comment thread is READ through the
     * community GraphQL `post(id)` — the same lazy hook (and the same
     * `["post-detail", postId]` cache) the community feed row uses. The REST list this
     * used to call (`GET /community/posts/{postId}/comments`) returns a `CommentResponse`
     * carrying only `authorId`, with no author card at all: every comment here was signed
     * with a raw uuid, linked to a profile URL that could only 404, and showed no avatar.
     *
     * `post` is already the card's own prop, hence the rename to `detail`.
     */
    const { post: detail, isLoading, error, mutate } = useQueryPostCommentsSwr(post.id, hasOpened)

    const regionId = `post-comments-${post.id}`
    // share the POST permalink (/community/{postId}), not the group page — sharing the
    // group dropped the reader on the feed with no way to tell which post was meant
    const postUrl = groupPostPermalink(locale, post.id)
    /**
     * Name actually rendered. The mapper leaves `author` empty when the BE sent no author
     * card (user without a profile row), and the card must show a shared member label
     * there — printing the author id was the old behaviour and it read as gibberish.
     */
    const authorName = post.author || tCommon("unknownMember")

    const onToggleComments = useCallback(() => {
        setHasOpened(true)
        setExpanded((prev) => !prev)
    }, [])

    /**
     * Composing stays on REST (`POST /community/posts/{postId}/comments`) — only the READ
     * moved to GraphQL. The shared community mutation owns that write, so the group feed
     * inherits its optimistic append + rollback and, crucially, its revalidation of the
     * `["post-detail", postId]` cache the thread now reads; the previous group-local
     * compose refreshed the retired `["group-post-comments", …]` cache instead.
     */
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

    return (
        <div className="flex flex-col rounded-2xl border border-separator transition-colors hover:bg-default/40">
            <div className="flex flex-col gap-2 p-4">
                <div className="flex items-center gap-3">
                    <UserLink
                        username={post.authorUsername}
                        displayName={authorName}
                        avatar={post.authorAvatar}
                        hideName
                        size="sm"
                        classNames={{ avatar: "size-8" }}
                    />
                    <UserLink
                        username={post.authorUsername}
                        displayName={authorName}
                        staffRole={post.authorStaffRole}
                        showAvatar={false}
                    />
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
                <MarkdownContent markdown={post.text} />
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
                    saveSource={{ kind: "group", id: groupId, label: authorName }}
                />
            </div>
            {expanded ? (
                <div className="px-4 pb-4">
                    <PostCommentThread
                        regionId={regionId}
                        comments={detail?.comments ?? []}
                        isLoading={isLoading && !detail}
                        hasError={!detail ? Boolean(error) : false}
                        // Hand the rejection over, like the community feed row does: the
                        // read is viewer-scoped, so the gateway answers an expired token
                        // with 401 PLATFORM_UNAUTHORIZED, a post the viewer may not see
                        // with FORBIDDEN and a removed one with COMMUNITY_POST_NOT_FOUND.
                        // Passing only `hasError` collapsed all three into one blanket
                        // line plus a retry that could never succeed.
                        error={error}
                        onRetry={() => void mutate()}
                        onSubmit={onSubmit}
                        onToggleCommentLike={toggleCommentReaction}
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
 * (likes/comments) + comment thread are wired to the real BE (changes
 * group-social-engagement, group-post-comments-graphql): the feed slice carries live
 * counters, comments are READ through the community GraphQL `post(id)` (author cards
 * included) and WRITTEN through the community REST comment endpoint.
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
        <div className="flex flex-col gap-3">
            {/* composer — static chrome, stays outside the async body so members can
                post into an empty (or still loading) feed */}
            <GroupFeedComposer groupId={groupId} />
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
                        <GroupFeedCard
                            key={post.id}
                            groupId={groupId}
                            post={post}
                            canPin={canPin}
                        />
                    ))}
                </div>
            </AsyncContent>
        </div>
    )
}
