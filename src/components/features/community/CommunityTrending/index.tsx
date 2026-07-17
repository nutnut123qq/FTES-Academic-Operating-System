"use client"

import React from "react"
import { Chip, Skeleton, Typography } from "@heroui/react"
import { useTranslations } from "next-intl"
import { Link } from "@/i18n/navigation"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import { UserAvatar } from "@/components/reuseable/UserAvatar"
import { useQueryTrendingSwr } from "../hooks/useQueryTrendingSwr"

/** Loading skeleton — mirrors the ranked trending rows so the layout never jumps. */
const TrendingSkeleton = () => (
    <div className="flex flex-col gap-3">
        {[0, 1, 2, 3].map((index) => (
            <div
                key={index}
                className="flex items-center gap-3 rounded-2xl border border-separator p-4"
            >
                <Skeleton className="size-8 shrink-0 rounded-full" />
                <div className="flex min-w-0 flex-1 flex-col gap-2">
                    <Skeleton className="h-3 w-40 rounded-full" />
                    <Skeleton className="h-3 w-24 rounded-full" />
                </div>
                <Skeleton className="h-6 w-16 rounded-full" />
            </div>
        ))}
    </div>
)

/**
 * Trending posts (§6). DEFAULT on-canon layout: a ranked list of posts by likes,
 * backed by the real BE `GET /api/v1/community/trending`. Each row shows the rank
 * badge, title, the author line (avatar + name) when the BE resolved the author
 * card, and the like count.
 */
export const CommunityTrending = () => {
    const t = useTranslations("communityHub")
    const { trending, isLoading, error, mutate } = useQueryTrendingSwr()

    return (
        <AsyncContent
            isLoading={isLoading && trending.length === 0}
            skeleton={<TrendingSkeleton />}
            isEmpty={trending.length === 0}
            emptyContent={{ title: t("trending.empty") }}
            error={trending.length === 0 ? error : undefined}
            errorContent={{
                title: t("trending.error"),
                onRetry: () => void mutate(),
                retryLabel: t("states.retry"),
            }}
        >
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
                        <div className="flex min-w-0 flex-1 flex-col gap-1">
                            <Typography type="body-sm" weight="medium" truncate>
                                {post.title}
                            </Typography>
                            {post.authorName ? (
                                <span className="flex min-w-0 items-center gap-1.5">
                                    <UserAvatar
                                        username={post.authorUsername}
                                        avatar={post.authorAvatarUrl}
                                        seed={post.authorSeed}
                                        size="sm"
                                        className="size-4 shrink-0"
                                    />
                                    <Typography type="body-xs" color="muted" truncate>
                                        {post.authorName}
                                    </Typography>
                                </span>
                            ) : null}
                        </div>
                        <Chip size="sm" variant="soft" color="accent">
                            {t("feed.likes", { count: post.likes })}
                        </Chip>
                    </Link>
                ))}
            </div>
        </AsyncContent>
    )
}
