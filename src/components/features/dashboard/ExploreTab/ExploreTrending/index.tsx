"use client"

import React from "react"
import { cn } from "@heroui/react"
import { useTranslations } from "next-intl"
import { useRouter } from "@/i18n/navigation"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import { LabeledCard } from "@/components/blocks/cards/LabeledCard"
import { SurfaceListCard, SurfaceListCardRow } from "@/components/blocks/cards/SurfaceListCard"
import { Skeleton } from "@/components/blocks/skeleton/Skeleton"
import type { WithClassNames } from "@/modules/types/base/class-name"
import {
    EXPLORE_TRENDING_LIMIT,
    useQueryExploreTrendingSwr,
} from "../../hooks/useQueryExploreTrendingSwr"

/** Loading state — mirrors the surface list (rank column + two text lines per row). */
const ExploreTrendingSkeleton = () => (
    <SurfaceListCard>
        {Array.from({ length: 3 }, (_, index) => (
            <div key={index} className="flex items-center gap-3 px-4 py-4">
                <Skeleton className="size-5 shrink-0 rounded-full" />
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <Skeleton.Typography type="body-sm" width="3/4" />
                    <Skeleton.Typography type="body-xs" width="1/3" />
                </div>
            </div>
        ))}
    </SurfaceListCard>
)

/** Props for {@link ExploreTrending}. */
export type ExploreTrendingProps = WithClassNames<undefined>

/**
 * "Đang nổi bật" discovery card of the dashboard EXPLORE tab — the community posts
 * the platform is ranking highest right now (`GET /community/trending`, scope
 * GLOBAL), as whole-row links into the post.
 *
 * The leading number is the row's LIST POSITION, not a server score: the backend
 * ranks ids in Redis and never serialises the score, so nothing here claims a trend
 * percentage or heat metric — the only numbers rendered are the post's own like /
 * comment counts. An empty ranking is a legitimate state (the job refreshes every 15
 * minutes), so it gets a real empty message rather than sample rows.
 *
 * Self-fetches its own leaf query and owns its four states; the section label and the
 * "see all" link sit OUTSIDE the async switch so the card keeps its identity while
 * loading, empty or failed.
 *
 * @param props - optional root class name (placement only)
 */
export const ExploreTrending = ({ className }: ExploreTrendingProps) => {
    const t = useTranslations()
    const router = useRouter()
    const { items, isLoading, error, mutate } = useQueryExploreTrendingSwr()

    return (
        <LabeledCard
            frameless
            className={cn(className)}
            label={t("dashboard.explore.trending.title")}
            onSeeMore={() => router.push("/community/trending")}
            seeMoreLabel={t("dashboard.explore.viewAll")}
        >
            <AsyncContent
                isLoading={isLoading && items.length === 0}
                skeleton={<ExploreTrendingSkeleton />}
                isEmpty={items.length === 0}
                emptyContent={{
                    title: t("dashboard.explore.trending.empty.title"),
                    description: t("dashboard.explore.trending.empty.description"),
                }}
                error={items.length === 0 ? error : undefined}
                errorContent={{
                    title: t("dashboard.explore.trending.error.title"),
                    onRetry: () => { void mutate() },
                    retryLabel: t("dashboard.retry"),
                }}
            >
                <SurfaceListCard>
                    {items.slice(0, EXPLORE_TRENDING_LIMIT).map((item, index) => (
                        <SurfaceListCardRow
                            key={item.id}
                            leading={(
                                <span
                                    aria-hidden
                                    className={cn(
                                        "w-5 shrink-0 text-center text-sm font-medium tabular-nums",
                                        index < 3 ? "text-accent-soft-foreground" : "text-muted",
                                    )}
                                >
                                    {index + 1}
                                </span>
                            )}
                            title={item.title}
                            subtitle={item.author || undefined}
                            meta={(
                                <span className="shrink-0 text-xs text-muted tabular-nums">
                                    {t("dashboard.explore.trending.engagement", {
                                        likes: item.likes,
                                        comments: item.comments,
                                    })}
                                </span>
                            )}
                            hover="underline"
                            onPress={() => router.push(`/community/${item.id}`)}
                        />
                    ))}
                </SurfaceListCard>
            </AsyncContent>
        </LabeledCard>
    )
}
