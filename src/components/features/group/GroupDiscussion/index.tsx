"use client"

import React, { useCallback, useState } from "react"
import { Typography } from "@heroui/react"
import { useLocale, useTranslations } from "next-intl"
import { useParams } from "next/navigation"
import { useAppSelector } from "@/redux/hooks"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import { Skeleton } from "@/components/blocks/skeleton/Skeleton"
import {
    PostEngagementBar,
    DISCUSSION_ENGAGEMENT_ACTIONS,
} from "@/components/reuseable/PostEngagementBar"
import { PostCommentThread } from "@/components/reuseable/PostCommentThread"
import { useQueryGroupThreadsSwr, type GroupThread } from "../hooks/useQueryGroupThreadsSwr"
import { useQueryGroupThreadCommentsSwr } from "../hooks/useQueryGroupThreadCommentsSwr"
import { useMutateReactGroupThreadSwr } from "../hooks/useMutateReactGroupThreadSwr"

/** One discussion thread row + inline (lazy, mock) comment thread. Like + comment ONLY. */
const GroupDiscussionRow = ({ groupId, thread }: { groupId: string; thread: GroupThread }) => {
    const locale = useLocale()
    const currentUser = useAppSelector((state) => state.user.user)
    const [expanded, setExpanded] = useState(false)
    const [hasOpened, setHasOpened] = useState(false)
    const reactThread = useMutateReactGroupThreadSwr(groupId)
    const { thread: comments, isLoading, error, mutate } = useQueryGroupThreadCommentsSwr(
        groupId,
        thread.id,
        hasOpened,
    )

    const regionId = `post-comments-${thread.id}`

    const onToggleComments = useCallback(() => {
        setHasOpened(true)
        setExpanded((prev) => !prev)
    }, [])

    // ponytail: mock BE — no discussion comment write contract. Append locally.
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
        [mutate, locale],
    )

    return (
        <div className="flex flex-col rounded-2xl border border-separator transition-colors hover:bg-default/40">
            <div className="flex flex-col gap-2 p-4">
                <div className="min-w-0">
                    <Typography type="body-sm" weight="medium" truncate>
                        {thread.title}
                    </Typography>
                    <Typography type="body-xs" color="muted">
                        {thread.author}
                    </Typography>
                </div>
                {/* discussion = like + comment ONLY — no share, no save */}
                <PostEngagementBar
                    className="pt-1"
                    actions={DISCUSSION_ENGAGEMENT_ACTIONS}
                    likes={thread.likes}
                    liked={thread.liked}
                    commentsCount={thread.replies}
                    onToggleLike={() => void reactThread(thread.id)}
                    onToggleComments={onToggleComments}
                    commentsExpanded={expanded}
                    commentsRegionId={regionId}
                />
            </div>
            {expanded ? (
                <div className="px-4 pb-4">
                    <PostCommentThread
                        regionId={regionId}
                        comments={comments?.comments ?? []}
                        isLoading={isLoading && !comments}
                        hasError={!comments ? Boolean(error) : false}
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

/** Loading skeleton — mirrors a discussion row (title + author + action row). */
const GroupDiscussionSkeleton = () => (
    <div className="flex flex-col gap-3">
        {[0, 1, 2].map((index) => (
            <div key={index} className="flex flex-col gap-2 rounded-2xl border border-separator p-4">
                <Skeleton.Typography type="body-sm" width="3/4" />
                <Skeleton.Typography type="body-xs" width="1/4" />
                <Skeleton.Typography type="body-xs" width="1/3" />
            </div>
        ))}
    </div>
)

/**
 * Group discussion (§7). Discussion thread rows with the shared engagement bar
 * configured for DISCUSSION (like + comment ONLY — no share, no save) and inline
 * push-down comment expansion (mock comments). ponytail: mock data.
 */
export const GroupDiscussion = () => {
    const t = useTranslations("groupsHub")
    const { groupId } = useParams<{ groupId: string }>()
    const { threads, isLoading, error, mutate } = useQueryGroupThreadsSwr(groupId)

    return (
        <AsyncContent
            isLoading={isLoading && threads.length === 0}
            skeleton={<GroupDiscussionSkeleton />}
            isEmpty={threads.length === 0}
            emptyContent={{ title: t("discussion.empty") }}
            error={threads.length === 0 ? error : undefined}
            errorContent={{
                title: t("discussion.error"),
                onRetry: () => void mutate(),
                retryLabel: t("states.retry"),
            }}
        >
            <div className="flex flex-col gap-3">
                {threads.map((thread) => (
                    <GroupDiscussionRow key={thread.id} groupId={groupId} thread={thread} />
                ))}
            </div>
        </AsyncContent>
    )
}
