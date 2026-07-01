"use client"

import React from "react"
import { Typography } from "@heroui/react"
import { useParams } from "next/navigation"
import { useQueryGroupFeedSwr } from "../hooks/useQueryGroupFeedSwr"

/**
 * Group feed (§7). DEFAULT on-canon layout: a list of group posts (author + time +
 * text). ponytail: rows hand-rolled with an initials avatar; mock data.
 */
export const GroupFeed = () => {
    const { groupId } = useParams<{ groupId: string }>()
    const { posts } = useQueryGroupFeedSwr(groupId)

    return (
        <div className="flex flex-col gap-3">
            {posts.map((post) => (
                <div key={post.id} className="flex flex-col gap-2 rounded-large border border-separator p-4">
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
                </div>
            ))}
        </div>
    )
}
