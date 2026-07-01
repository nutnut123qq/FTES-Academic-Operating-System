"use client"

import React from "react"
import {
    Card,
    CardContent,
    Typography,
} from "@heroui/react"
import {
    ChatCircleIcon,
    PushPinIcon,
    SealCheckIcon,
} from "@phosphor-icons/react"
import { useTranslations } from "next-intl"
import { getTimeAgoLabel, getTimeAgoMessage } from "@/modules/dayjs"
import { ReactionBar } from "../ReactionBar"
import { ReactionType } from "@/modules/api/graphql/queries/types/discussion"
import type { QueryCommunityFeedItemData } from "@/modules/api/graphql/queries/types/community-feed"
import type { WithClassNames } from "@/modules/types/base/class-name"
import { UserAvatar } from "@/components/reuseable/UserAvatar"
import { MarkdownContent } from "@/components/reuseable/MarkdownContent"

/** Props for the {@link CommunityPostCard} block. */
export interface CommunityPostCardProps extends WithClassNames<undefined> {
    /** The post to render (author relation already loaded). */
    post: QueryCommunityFeedItemData
    /**
     * React handler — `(postId, emotion | null)`. Omit to render the reaction bar
     * READ-ONLY (e.g. when the viewer is signed out).
     */
    onReact?: (postId: string, type: ReactionType | null) => void
    /** Toggle the comment thread for this post. Omit to render the count static. */
    onToggleComments?: () => void
    /** Optional content rendered inside the card below the footer (e.g. comments). */
    children?: React.ReactNode
}

/**
 * One community feed post: author header (avatar + name + relative time + channel
 * + pinned badge), the markdown body, and a footer with the reaction bar + comment
 * count. Pure block: owns its look; the owning feature supplies data + the react
 * handler. Body renders via MarkdownContent (compact) so inline code/markdown the
 * author wrote shows correctly.
 *
 * @param props - {@link CommunityPostCardProps}
 */
export const CommunityPostCard = ({
    post,
    onReact,
    onToggleComments,
    children,
    className,
}: CommunityPostCardProps) => {
    const t = useTranslations()
    // resolve the display name, falling back to the username when unset
    const displayName = post.author.displayName || post.author.username
    // relative "x minutes ago" label, localized via the shared timeAgo keys
    const timeAgo = getTimeAgoLabel(getTimeAgoMessage(post.createdAt), t)

    return (
        <Card className={className}>
            <CardContent>
                <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-3">
                        <UserAvatar
                            username={post.author.username}
                            avatar={post.author.avatar}
                        />
                        <div className="flex min-w-0 flex-1 flex-col">
                            <div className="flex items-center gap-1">
                                <Typography type="body-sm" weight="semibold" truncate>
                                    {displayName}
                                </Typography>
                                {post.isFounderAuthor ? (
                                    <SealCheckIcon
                                        weight="fill"
                                        className="size-4 shrink-0 text-accent"
                                    />
                                ) : null}
                            </div>
                            <div className="flex items-center gap-2">
                                <Typography type="body-xs" color="muted" truncate>
                                    {`@${post.author.username}`}
                                </Typography>
                                <Typography type="body-xs" color="muted">
                                    {"·"}
                                </Typography>
                                <Typography type="body-xs" color="muted">
                                    {timeAgo}
                                </Typography>
                                <Typography type="body-xs" className="text-accent">
                                    {t(`community.channel.${post.channel}`)}
                                </Typography>
                            </div>
                        </div>
                        {post.isPinned ? (
                            <PushPinIcon weight="fill" className="size-4 shrink-0 text-accent" />
                        ) : null}
                    </div>

                    <MarkdownContent markdown={post.body} className="[&_p]:m-0" />

                    <div className="flex items-center gap-6">
                        <ReactionBar
                            count={post.reactions.total}
                            myReaction={post.reactions.myReaction}
                            onReact={onReact ? (type) => onReact(post.id, type) : undefined}
                        />
                        <button
                            type="button"
                            disabled={!onToggleComments}
                            onClick={onToggleComments}
                            className="flex items-center gap-1 rounded-full px-2 py-0.5 text-muted transition-colors hover:bg-default/40 disabled:cursor-default disabled:hover:bg-transparent"
                        >
                            <ChatCircleIcon className="size-4 shrink-0" />
                            <Typography type="body-xs" color="muted">
                                {post.commentCount}
                            </Typography>
                        </button>
                    </div>

                    {children}
                </div>
            </CardContent>
        </Card>
    )
}
