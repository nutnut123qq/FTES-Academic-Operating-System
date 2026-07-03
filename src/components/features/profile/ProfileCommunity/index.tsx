"use client"

import React from "react"
import { Typography } from "@heroui/react"
import { useLocale, useTranslations } from "next-intl"
import {
    ArticleIcon,
    CaretRightIcon,
    ChatCircleTextIcon,
    HeartIcon,
    TrophyIcon,
} from "@phosphor-icons/react"
import { Link, useRouter } from "@/i18n/navigation"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import { EmptyContent } from "@/components/blocks/async/EmptyContent"
import { LabeledCard } from "@/components/blocks/cards/LabeledCard"
import { MetricCard } from "@/components/blocks/stats/MetricCard"
import { Skeleton } from "@/components/blocks/skeleton/Skeleton"
import { useQueryMyCommunitySummarySwr } from "../hooks/useQueryMyCommunitySummarySwr"

/** Reputation tile definition. */
const REPUTATION_TILES: Array<{
    key: "score" | "posts" | "comments" | "reactions"
    icon: React.ReactNode
}> = [
    { key: "score", icon: <TrophyIcon className="size-5 text-accent" aria-hidden focusable="false" /> },
    { key: "posts", icon: <ArticleIcon className="size-5 text-accent" aria-hidden focusable="false" /> },
    { key: "comments", icon: <ChatCircleTextIcon className="size-5 text-accent" aria-hidden focusable="false" /> },
    { key: "reactions", icon: <HeartIcon className="size-5 text-accent" aria-hidden focusable="false" /> },
]

/** Skeleton mirroring the reputation tiles + posts list. */
const CommunitySkeleton = () => (
    <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-3">
            <Skeleton.Typography type="h6" width="1/3" />
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <Skeleton.Metric />
                <Skeleton.Metric />
                <Skeleton.Metric />
                <Skeleton.Metric />
            </div>
        </div>
        <div className="flex flex-col gap-3">
            <Skeleton.Typography type="h6" width="1/3" />
            <Skeleton.ListRow />
            <Skeleton.ListRow />
            <Skeleton.ListRow />
        </div>
    </div>
)

/**
 * Community section of the profile (§2/§18). Redesigned into a reputation
 * metric grid and a labeled card of recent posts.
 */
export const ProfileCommunity = () => {
    const t = useTranslations()
    const locale = useLocale()
    const router = useRouter()
    const { data, isLoading, error } = useQueryMyCommunitySummarySwr()

    const tiles = data
        ? REPUTATION_TILES.map((tile) => ({
            ...tile,
            value: data.reputation[tile.key],
        }))
        : []

    return (
        <AsyncContent
            isLoading={isLoading && !data}
            skeleton={<CommunitySkeleton />}
            error={!data ? error : undefined}
            errorContent={{
                title: t("profile.loadingError"),
                retryLabel: t("profile.retry"),
                onRetry: () => {
                    void router.refresh()
                },
            }}
        >
            {data ? (
                <div className="flex flex-col gap-6">
                    <LabeledCard label={t("profile.community.reputation.title")}>
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                            {tiles.map((tile) => (
                                <MetricCard
                                    key={tile.key}
                                    icon={tile.icon}
                                    value={tile.value.toLocaleString(locale)}
                                    label={t(`profile.community.reputation.${tile.key}`)}
                                />
                            ))}
                        </div>
                    </LabeledCard>

                    <LabeledCard
                        label={t("profile.community.recentPosts.title")}
                        onSeeMore={() => router.push("/community")}
                        seeMoreLabel={t("profile.community.empty.browse")}
                    >
                        {data.recentPosts.length === 0 ? (
                            <EmptyContent title={t("profile.community.empty.title")} />
                        ) : (
                            <div className="flex flex-col gap-3">
                                {data.recentPosts.map((post) => (
                                    <Link
                                        key={post.id}
                                        href={`/community/${post.id}`}
                                        className="group flex items-center gap-3 rounded-2xl border border-separator p-4 no-underline transition-colors hover:bg-surface-secondary"
                                    >
                                        <Typography
                                            type="body-sm"
                                            weight="medium"
                                            className="min-w-0 flex-1"
                                            truncate
                                        >
                                            {post.title}
                                        </Typography>
                                        <Typography
                                            type="body-xs"
                                            color="muted"
                                            className="hidden shrink-0 sm:block"
                                        >
                                            {t("profile.community.recentPosts.engagement", {
                                                likes: post.likeCount,
                                                comments: post.commentCount,
                                            })}
                                        </Typography>
                                        <Typography
                                            type="body-xs"
                                            color="muted"
                                            className="shrink-0"
                                        >
                                            {post.dateLabel}
                                        </Typography>
                                        <CaretRightIcon
                                            className="size-4 shrink-0 text-muted transition-transform group-hover:translate-x-1"
                                            aria-hidden
                                            focusable="false"
                                        />
                                    </Link>
                                ))}
                            </div>
                        )}
                    </LabeledCard>
                </div>
            ) : null}
        </AsyncContent>
    )
}
