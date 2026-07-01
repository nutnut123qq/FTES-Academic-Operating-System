"use client"

import React from "react"
import { Typography } from "@heroui/react"
import { useTranslations } from "next-intl"
import { Link } from "@/i18n/navigation"
import { useQueryCommunityFeedSwr } from "../hooks/useQueryCommunityFeedSwr"

/**
 * Community feed (§6). DEFAULT on-canon layout: a list of post rows (author +
 * time + title + snippet + like/comment counts) linking to the post. ponytail:
 * rows hand-rolled with an initials avatar; mock data.
 */
export const CommunityFeed = () => {
    const t = useTranslations("communityHub")
    const { posts } = useQueryCommunityFeedSwr()

    return (
        <div className="flex flex-col gap-3">
            {posts.map((post) => (
                <Link
                    key={post.id}
                    href={`/community/${post.id}`}
                    className="flex flex-col gap-2 rounded-large border border-separator p-4 no-underline transition-colors hover:bg-default/40"
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
                    <Typography type="body-xs" color="muted">
                        {t("feed.likes", { count: post.likes })} · {t("feed.comments", { count: post.comments })}
                    </Typography>
                </Link>
            ))}
        </div>
    )
}
