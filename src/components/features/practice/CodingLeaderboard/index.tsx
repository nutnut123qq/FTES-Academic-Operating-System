"use client"

import React from "react"
import { Chip, Typography, cn } from "@heroui/react"
import useSWR from "swr"
import { useTranslations } from "next-intl"
import { useAppSelector } from "@/redux/hooks"
import { queryCodingLeaderboard } from "@/modules/api/graphql/queries/query-coding-leaderboard"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import { Skeleton } from "@/components/blocks/skeleton/Skeleton"
import { UserAvatar } from "@/components/reuseable/UserAvatar"
import type { WithClassNames } from "@/modules/types/base/class-name"

/** Max ranked users to pull for the board (backend caps this too). */
const LEADERBOARD_LIMIT = 50

/** Props for {@link CodingLeaderboard}. */
export type CodingLeaderboardProps = WithClassNames<undefined>

/**
 * The GLOBAL coding leaderboard — every user ranked by **distinct problems solved**
 * (`solvedCount`, the exact axis the backend `codingLeaderboard` orders on; NOT
 * points — those are a different currency). A single capped reading column
 * (`max-w-2xl`): rank · avatar · name · "N solved", with the signed-in viewer's
 * row accent-tinted. The viewer's own standing (rank / percentile / points) lives
 * in the {@link ProgressCockpit} above this on the page, so the board itself is
 * just the list. **No podium** — coding is a pure ranked list. Self-contained: it
 * reads the viewer id from the store and drives its own SWR.
 *
 * @param props - optional className for the root element.
 */
export const CodingLeaderboard = ({ className }: CodingLeaderboardProps) => {
    const t = useTranslations()
    // viewer identity highlights their own row
    const viewerId = useAppSelector((state) => state.user.user?.id) ?? null

    const { data, isLoading, error, mutate } = useSWR(
        ["coding-leaderboard", LEADERBOARD_LIMIT],
        async () => {
            const response = await queryCodingLeaderboard({
                request: { limit: LEADERBOARD_LIMIT },
            })
            return response.data?.codingLeaderboard.data ?? []
        },
    )

    const entries = data ?? []

    return (
        <AsyncContent
            isLoading={isLoading && !data}
            skeleton={(
                <div className={cn("mx-auto flex w-full max-w-2xl flex-col gap-3", className)}>
                    {[0, 1, 2, 3, 4, 5].map((index) => (
                        <div key={index} className="flex items-center gap-3 px-3 py-2">
                            <Skeleton className="size-6 rounded-md" />
                            <Skeleton className="size-9 rounded-full" />
                            <div className="flex flex-1 flex-col gap-2">
                                <Skeleton.Typography type="body-sm" width="1/3" />
                            </div>
                            <Skeleton.Typography type="body-sm" width="1/4" />
                        </div>
                    ))}
                </div>
            )}
            isEmpty={entries.length === 0}
            emptyContent={{
                title: t("practice.leaderboard.empty"),
            }}
            error={error}
            errorContent={{
                title: t("practice.leaderboard.error"),
                onRetry: () => { void mutate() },
                retryLabel: t("practice.retry"),
            }}
        >
            <div className={cn("mx-auto flex w-full max-w-2xl flex-col gap-3", className)}>
                {entries.map((entry, index) => {
                    // rank is implicit array order (board is pre-sorted by solvedCount desc)
                    const rank = index + 1
                    const isViewer = !!viewerId && entry.userId === viewerId
                    return (
                        <div
                            key={entry.userId}
                            className={cn(
                                "flex items-center gap-3 rounded-2xl px-3 py-2 transition-colors",
                                isViewer ? "bg-accent/10" : "hover:bg-default-50",
                            )}
                        >
                            {/* rank position */}
                            <Typography type="body-sm" weight="semibold" color="muted" align="center" className="w-6 shrink-0">
                                {rank}
                            </Typography>
                            <UserAvatar
                                username={entry.username}
                                size="sm"
                                className={cn(isViewer && "ring-2 ring-accent")}
                            />
                            {/* learner name + "you" chip on the viewer's row */}
                            <div className="flex min-w-0 flex-1 items-center gap-2">
                                <Typography type="body-sm" weight="medium" className="line-clamp-1">
                                    {entry.username}
                                </Typography>
                                {isViewer && (
                                    <Chip size="sm" variant="soft" color="accent">
                                        {t("practice.leaderboard.you")}
                                    </Chip>
                                )}
                            </div>
                            {/* the ranking metric — distinct problems solved (NOT points) */}
                            <Typography type="body-sm" weight="semibold" className="shrink-0 text-accent">
                                {t("practice.leaderboard.solved", { count: entry.solvedCount })}
                            </Typography>
                        </div>
                    )
                })}
            </div>
        </AsyncContent>
    )
}
