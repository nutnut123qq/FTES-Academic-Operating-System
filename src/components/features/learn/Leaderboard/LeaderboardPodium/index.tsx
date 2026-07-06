"use client"

import React, { useMemo } from "react"
import { Typography, cn } from "@heroui/react"
import { CrownIcon } from "@phosphor-icons/react"
import { useTranslations } from "next-intl"
import { UserAvatar } from "@/components/reuseable/UserAvatar"
import {
    categoryEntryXp,
    type LeaderboardCategory,
    type RankedLeaderboardEntry,
} from "../../hooks/useQueryLearnLeaderboardSwr"

/** Podium column order (2nd, 1st, 3rd) so #1 sits centered + raised. */
const PODIUM_ORDER = [2, 1, 3]
/** Pedestal height per rank. */
const PEDESTAL_HEIGHT: Record<number, string> = { 1: "h-20", 2: "h-14", 3: "h-10" }

/** Props for {@link LeaderboardPodium}. */
export interface LeaderboardPodiumProps {
    /** Top-3 ranked rows. */
    top: Array<RankedLeaderboardEntry>
    selectedCategory: LeaderboardCategory
    viewerUserId?: string | null
    className?: string
}

/**
 * Top-3 podium (StarCI port): #1 centered + crowned + raised on a taller pedestal,
 * #2 / #3 flanking. The viewer's own spot gets an accent ring + accent XP + a "You"
 * label. Pedestals are neutral so the crown carries the win.
 *
 * @param props - {@link LeaderboardPodiumProps}
 */
export const LeaderboardPodium = ({ top, selectedCategory, viewerUserId, className }: LeaderboardPodiumProps) => {
    const t = useTranslations("learn")
    const byRank = useMemo(() => {
        const map = new Map<number, RankedLeaderboardEntry>()
        top.forEach((row) => map.set(row.displayRank, row))
        return map
    }, [top])

    return (
        <div className={cn("flex items-end justify-center gap-3 sm:gap-4", className)}>
            {PODIUM_ORDER.map((rank) => {
                const row = byRank.get(rank)
                if (!row) {
                    return <div key={rank} className="w-24" />
                }
                const { entry } = row
                const isViewer = Boolean(viewerUserId) && entry.userId === viewerUserId
                const isLeader = rank === 1
                return (
                    <div key={rank} className="flex w-24 flex-col items-center gap-1.5">
                        <div className="relative">
                            {isLeader ? (
                                <CrownIcon
                                    aria-hidden
                                    focusable="false"
                                    weight="fill"
                                    className="absolute -top-4 left-1/2 size-5 -translate-x-1/2 text-warning"
                                />
                            ) : null}
                            <UserAvatar
                                username={entry.username}
                                avatar={entry.avatar}
                                size={isLeader ? "lg" : "md"}
                                className={cn(isViewer && "ring-2 ring-accent")}
                            />
                        </div>
                        <Typography type="body-sm" weight={isViewer ? "semibold" : "medium"} className="line-clamp-1 text-center">
                            {isViewer ? t("leaderboard.you") : entry.displayName}
                        </Typography>
                        <Typography type="body-xs" className={cn("shrink-0", isViewer ? "text-accent" : "text-muted")}>
                            {t("leaderboard.xp", { value: categoryEntryXp(entry, selectedCategory) })}
                        </Typography>
                        <div
                            className={cn(
                                "flex w-full items-center justify-center rounded-t-xl bg-default text-sm font-medium text-muted",
                                PEDESTAL_HEIGHT[rank],
                            )}
                        >
                            {rank}
                        </div>
                    </div>
                )
            })}
        </div>
    )
}

export default LeaderboardPodium
