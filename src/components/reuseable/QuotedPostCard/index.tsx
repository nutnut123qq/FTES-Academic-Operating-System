"use client"

import React from "react"
import { Typography, cn } from "@heroui/react"
import { UserLink } from "@/components/features/identity"
import type { WithClassNames } from "@/modules/types/base/class-name"

/** The embedded post shown inside a repost/quote. */
export interface QuotedPost {
    id: string
    author: string
    authorUsername: string
    title: string
    snippet: string
}

/** Props for {@link QuotedPostCard}. */
export interface QuotedPostCardProps extends WithClassNames<undefined> {
    /** The quoted post to embed. */
    post: QuotedPost
}

/**
 * Bordered, rounded card embedding a quoted/reposted community post — the author
 * line plus the post's title and snippet. Rendered inside the composer's quote
 * preview and (when the feed exposes share data) inside a repost feed row. Purely
 * presentational; the author is a real {@link UserLink} hovercard.
 *
 * @param props - {@link QuotedPostCardProps}
 */
export const QuotedPostCard = ({ post, className }: QuotedPostCardProps) => {
    return (
        <div className={cn("rounded-large border border-separator p-3", className)}>
            <div className="flex items-center gap-2">
                <UserLink
                    username={post.authorUsername}
                    displayName={post.author}
                    hideName
                    size="sm"
                    classNames={{ avatar: "size-6" }}
                />
                <UserLink username={post.authorUsername} displayName={post.author} showAvatar={false} />
            </div>
            {post.title ? (
                <Typography type="body-sm" weight="medium" className="mt-1">
                    {post.title}
                </Typography>
            ) : null}
            {post.snippet ? (
                <Typography type="body-sm" color="muted" className="line-clamp-3">
                    {post.snippet}
                </Typography>
            ) : null}
        </div>
    )
}
