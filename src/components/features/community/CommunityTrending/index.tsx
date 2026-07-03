"use client"

import React from "react"
import { Chip, Typography } from "@heroui/react"
import { useTranslations } from "next-intl"
import { Link } from "@/i18n/navigation"
import { useQueryTrendingSwr } from "../hooks/useQueryTrendingSwr"

/**
 * Trending posts (§6). DEFAULT on-canon layout: a ranked list of posts by likes.
 * ponytail: rows hand-rolled with a rank badge; mock data.
 */
export const CommunityTrending = () => {
    const t = useTranslations("communityHub")
    const { trending } = useQueryTrendingSwr()

    return (
        <div className="flex flex-col gap-3">
            {trending.map((post, index) => (
                <Link
                    key={post.id}
                    href={`/community/${post.id}`}
                    className="flex items-center gap-3 rounded-2xl border border-separator p-4 no-underline transition-colors hover:bg-default/40"
                >
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-accent/10 text-sm font-bold text-accent">
                        {index + 1}
                    </div>
                    <div className="min-w-0 flex-1">
                        <Typography type="body-sm" weight="medium" truncate>
                            {post.title}
                        </Typography>
                        <Typography type="body-xs" color="muted">
                            {post.author}
                        </Typography>
                    </div>
                    <Chip size="sm" variant="soft" color="accent">
                        {t("feed.likes", { count: post.likes })}
                    </Chip>
                </Link>
            ))}
        </div>
    )
}
