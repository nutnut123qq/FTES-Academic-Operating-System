"use client"

import React from "react"
import { Chip, Typography, cn } from "@heroui/react"
import { useTranslations } from "next-intl"
import { CrownIcon } from "@phosphor-icons/react"
import { UserAvatar } from "@/components/reuseable/UserAvatar"
import type { CourseLeaderboardEntry } from "@/modules/api/graphql/queries/types/course-leaderboard"
import type { WithClassNames } from "@/modules/types/base/class-name"

/** Props for {@link LeaderboardChampion}. */
export interface LeaderboardChampionProps extends WithClassNames<undefined> {
    /** The lone (rank-1) learner. */
    entry: CourseLeaderboardEntry
    /** Total XP to display (the canonical metric, not a per-category slice). */
    totalXp: number
    /** Current viewer's user id — labels the card "You" when it's them. */
    viewerUserId?: string | null
}

/**
 * The sole-learner state: one clean "champion" card (surface, crown, rank #1)
 * instead of a one-row table — keeps a sparse leaderboard from looking broken
 * without a heavy fill.
 *
 * @param props - {@link LeaderboardChampionProps}
 */
export const LeaderboardChampion = ({ entry, totalXp, viewerUserId, className }: LeaderboardChampionProps) => {
    const t = useTranslations()
    const isViewer = !!viewerUserId && entry.userId === viewerUserId
    return (
        <div className={cn("flex items-center gap-4 rounded-3xl border border-default bg-surface px-5 py-4", className)}>
            <div className="relative shrink-0">
                <CrownIcon
                    aria-hidden
                    focusable="false"
                    className="absolute -top-3.5 left-1/2 size-5 -translate-x-1/2 text-warning"
                />
                <UserAvatar
                    username={entry.username}
                    avatar={entry.avatar}
                    size="lg"
                    className={cn(isViewer && "ring-2 ring-accent")}
                />
            </div>
            <div className="flex min-w-0 flex-1 flex-col gap-0">
                <div className="flex items-center gap-2">
                    <Typography type="body" weight="semibold" className="line-clamp-1">
                        {entry.username}
                    </Typography>
                    {isViewer && (
                        <Chip size="sm" variant="soft" color="accent">
                            {t("leaderboard.you")}
                        </Chip>
                    )}
                </div>
                <Typography type="body-sm" color="muted">
                    {t("leaderboard.champion")}
                </Typography>
            </div>
            <div className="shrink-0 text-right">
                <Typography type="h4" weight="bold" className="text-accent">
                    {totalXp}
                </Typography>
                <Typography type="body-xs" color="muted">
                    {t("leaderboard.xpLabel")}
                </Typography>
            </div>
        </div>
    )
}

export default LeaderboardChampion
