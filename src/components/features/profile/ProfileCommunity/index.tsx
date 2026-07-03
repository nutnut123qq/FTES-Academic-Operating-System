"use client"

import React from "react"
import { Typography } from "@heroui/react"
import { useLocale, useTranslations } from "next-intl"
import { Link } from "@/i18n/navigation"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import { Skeleton } from "@/components/blocks/skeleton/Skeleton"
import { useQueryMyCommunitySummarySwr } from "../hooks/useQueryMyCommunitySummarySwr"

/** Skeleton mirroring the snapshot tiles + posts list. */
const CommunitySkeleton = () => (
    <div className="flex flex-col gap-6">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Skeleton className="h-20 rounded-large" />
            <Skeleton className="h-20 rounded-large" />
            <Skeleton className="h-20 rounded-large" />
            <Skeleton className="h-20 rounded-large" />
        </div>
        <div className="flex flex-col gap-3">
            <Skeleton.ListRow />
            <Skeleton.ListRow />
            <Skeleton.ListRow />
        </div>
    </div>
)

/**
 * Community section of the profile — a READ-ONLY summary fed by
 * `useQueryMyCommunitySummarySwr`: the reputation snapshot (score + post /
 * comment / reaction counts, every number labeled) and the viewer's recent
 * posts, each row a focusable link into its community post route. Authoring
 * lives in the community section — nothing here mutates.
 */
export const ProfileCommunity = () => {
    const t = useTranslations("profile")
    const locale = useLocale()
    const { data, isLoading, error } = useQueryMyCommunitySummarySwr()

    const tiles: Array<{ key: "score" | "posts" | "comments" | "reactions"; value: number }> = data
        ? [
            { key: "score", value: data.reputation.score },
            { key: "posts", value: data.reputation.posts },
            { key: "comments", value: data.reputation.comments },
            { key: "reactions", value: data.reputation.reactions },
        ]
        : []

    return (
        <AsyncContent
            isLoading={isLoading && !data}
            skeleton={<CommunitySkeleton />}
            error={!data ? error : undefined}
        >
            {data ? (
                <div className="flex flex-col gap-6">
                    {/* reputation snapshot — zeros still render when there is no activity */}
                    <div className="flex flex-col gap-3">
                        <Typography type="h6" weight="bold">
                            {t("community.reputation.title")}
                        </Typography>
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                            {tiles.map((tile) => (
                                <div key={tile.key} className="flex flex-col gap-1 rounded-2xl bg-default/40 p-4">
                                    <Typography type="body-xs" color="muted">
                                        {t(`community.reputation.${tile.key}`)}
                                    </Typography>
                                    <Typography type="h4" weight="bold">
                                        {tile.value.toLocaleString(locale)}
                                    </Typography>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* recent posts */}
                    <div className="flex flex-col gap-3 border-t border-separator pt-6">
                        <Typography type="h6" weight="bold">
                            {t("community.recentPosts.title")}
                        </Typography>
                        {data.recentPosts.length === 0 ? (
                            <div className="flex flex-col items-center gap-2 rounded-large border border-dashed border-separator p-6 text-center">
                                <Typography type="body-sm" color="muted">
                                    {t("community.empty.title")}
                                </Typography>
                                <Link
                                    href="/community"
                                    className="text-sm font-medium text-accent no-underline hover:underline"
                                >
                                    {t("community.empty.browse")}
                                </Link>
                            </div>
                        ) : (
                            data.recentPosts.map((post) => (
                                <Link
                                    key={post.id}
                                    href={`/community/${post.id}`}
                                    className="flex flex-wrap items-center gap-3 rounded-2xl border border-separator p-4 no-underline transition-colors hover:bg-default/40"
                                >
                                    <Typography type="body-sm" weight="medium" className="min-w-0 flex-1" truncate>
                                        {post.title}
                                    </Typography>
                                    <Typography type="body-xs" color="muted" className="shrink-0">
                                        {t("community.recentPosts.engagement", {
                                            likes: post.likeCount,
                                            comments: post.commentCount,
                                        })}
                                    </Typography>
                                    <Typography type="body-xs" color="muted" className="shrink-0">
                                        {post.dateLabel}
                                    </Typography>
                                </Link>
                            ))
                        )}
                    </div>
                </div>
            ) : null}
        </AsyncContent>
    )
}
