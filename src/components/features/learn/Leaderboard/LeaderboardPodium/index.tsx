"use client"

import React from "react"
import { Typography, cn } from "@heroui/react"
import { useTranslations } from "next-intl"
import { CrownIcon } from "@phosphor-icons/react"
import { categoryEntryXp, type LeaderboardCategoryKey, type RankedLeaderboardEntry } from "../categories"
import { UserAvatar } from "@/components/reuseable/UserAvatar"
import type { WithClassNames } from "@/modules/types/base/class-name"

/** Props for {@link LeaderboardPodium}. */
export interface LeaderboardPodiumProps extends WithClassNames<undefined> {
    /** The top-3 ranked entries (rank 1..3). */
    top: Array<RankedLeaderboardEntry>
    /** Category driving the XP value shown. */
    selectedCategory: LeaderboardCategoryKey
    /** Current viewer's user id — accents their pedestal. */
    viewerUserId?: string | null
}

/** Visual order (left → right): 2nd, 1st (center, tallest), 3rd. */
const PODIUM_ORDER = [2, 1, 3] as const
/** Pedestal height per rank. */
const PEDESTAL_HEIGHT: Record<number, string> = { 1: "h-20", 2: "h-14", 3: "h-10" }

/**
 * Top-3 podium: the leader centered + crowned on the tallest pedestal, runner-up
 * left, third right. Neutral surface pedestals (the accent is reserved for the
 * viewer's own pedestal + crown — no heavy fills). Shown only when the board has
 * at least three ranked learners.
 *
 * @param props - {@link LeaderboardPodiumProps}
 */
export const LeaderboardPodium = ({ top, selectedCategory, viewerUserId, className }: LeaderboardPodiumProps) => {
    const t = useTranslations()
    const byRank = new Map(top.map((row) => [row.displayRank, row]))

    return (
        <div className={cn("flex items-end justify-center gap-3 sm:gap-4", className)}>
            {PODIUM_ORDER.map((rank) => {
                const row = byRank.get(rank)
                if (!row) {
                    return null
                }
                const { entry } = row
                const isViewer = !!viewerUserId && entry.userId === viewerUserId
                const isLeader = rank === 1
                return (
                    <div key={rank} className="flex w-24 flex-col items-center gap-1.5">
                        <div className="relative">
                            {isLeader ? (
                                <CrownIcon
                                    aria-hidden
                                    focusable="false"
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
                            {isViewer ? t("leaderboard.you") : entry.username}
                        </Typography>
                        <Typography type="body-xs" className={cn("shrink-0", isViewer ? "text-accent" : "text-muted")}>
                            {t("leaderboard.xp", { xp: categoryEntryXp(entry, selectedCategory) })}
                        </Typography>
                        <div
                            className={cn(
                                "flex w-full items-center justify-center rounded-t-xl text-sm font-medium",
                                PEDESTAL_HEIGHT[rank],
                                isViewer ? "bg-accent/15 text-accent" : "bg-default text-muted",
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
