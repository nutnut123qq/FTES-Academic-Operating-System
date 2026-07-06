"use client"

import React from "react"
import { Chip, Typography, cn } from "@heroui/react"
import { CrownIcon } from "@phosphor-icons/react"
import { useTranslations } from "next-intl"
import { UserAvatar } from "@/components/reuseable/UserAvatar"
import type { LeaderboardEntry } from "../../hooks/useQueryLearnLeaderboardSwr"

/** Props for {@link LeaderboardChampion}. */
export interface LeaderboardChampionProps {
    entry: LeaderboardEntry
    /** The canonical total XP (not per-category). */
    totalXp: number
    viewerUserId?: string | null
    className?: string
}

/**
 * Single-learner "course champion" card (StarCI port) — shown when the board has
 * exactly one entry, so a full podium would read oddly. Avatar + crown + name +
 * "champion" caption on the left, the big XP number on the right.
 *
 * @param props - {@link LeaderboardChampionProps}
 */
export const LeaderboardChampion = ({ entry, totalXp, viewerUserId, className }: LeaderboardChampionProps) => {
    const t = useTranslations("learn")
    const isViewer = Boolean(viewerUserId) && entry.userId === viewerUserId
    return (
        <div className={cn("flex items-center gap-4 rounded-3xl border border-default bg-surface px-5 py-4", className)}>
            <div className="relative shrink-0">
                <CrownIcon
                    aria-hidden
                    focusable="false"
                    weight="fill"
                    className="absolute -top-3.5 left-1/2 size-5 -translate-x-1/2 text-warning"
                />
                <UserAvatar
                    username={entry.username}
                    avatar={entry.avatar}
                    size="lg"
                    className={cn(isViewer && "ring-2 ring-accent")}
                />
            </div>
            <div className="flex min-w-0 flex-1 flex-col">
                <div className="flex items-center gap-2">
                    <Typography type="body" weight="semibold" className="line-clamp-1">
                        {entry.displayName}
                    </Typography>
                    {isViewer ? (
                        <Chip size="sm" variant="soft" color="accent">
                            {t("leaderboard.you")}
                        </Chip>
                    ) : null}
                </div>
                <Typography type="body-sm" color="muted">
                    {t("leaderboard.champion")}
                </Typography>
            </div>
            <div className="shrink-0 text-right">
                <Typography type="h4" weight="bold" className={cn(isViewer ? "text-accent" : "text-foreground")}>
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
