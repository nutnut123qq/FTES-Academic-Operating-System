"use client"

import React from "react"
import { Chip, Typography, cn } from "@heroui/react"
import { CrownIcon } from "@phosphor-icons/react"
import { useTranslations } from "next-intl"
import { UserAvatar } from "@/components/reuseable/UserAvatar"
import {
    CATEGORY_COLOR,
    MILESTONE_XP,
    READING_XP,
    categoryEntryXp,
    type LeaderboardCategory,
    type LeaderboardEntry,
    type RankedLeaderboardEntry,
} from "../../hooks/useQueryLearnLeaderboardSwr"

/** Props for {@link LeaderboardTable}. */
export interface LeaderboardTableProps {
    rankedEntries: Array<RankedLeaderboardEntry>
    selectedCategory: LeaderboardCategory
    viewerUserId?: string | null
    className?: string
}

/**
 * The ranked list below the podium (StarCI port). Compact rows: rank (crown on
 * #1), avatar, name (+ "You" chip on the viewer), a thin XP-composition bar
 * showing the challenge / reading / milestone split, and the XP for the active
 * category (accent on the viewer's row).
 *
 * @param props - {@link LeaderboardTableProps}
 */
export const LeaderboardTable = ({ rankedEntries, selectedCategory, viewerUserId, className }: LeaderboardTableProps) => {
    const t = useTranslations("learn")
    return (
        <div className={cn("flex flex-col gap-0.5", className)}>
            {rankedEntries.map(({ entry, displayRank }) => {
                const isViewer = Boolean(viewerUserId) && entry.userId === viewerUserId
                return (
                    <div
                        key={entry.enrollmentId}
                        className="flex items-center gap-3 rounded-2xl px-2 py-2 transition-colors hover:bg-default/60"
                    >
                        <div className="flex w-5 shrink-0 justify-center">
                            {displayRank === 1 ? (
                                <CrownIcon aria-hidden focusable="false" weight="fill" className="size-5 text-warning" />
                            ) : (
                                <Typography type="body-sm" weight="semibold" color="muted">
                                    {displayRank}
                                </Typography>
                            )}
                        </div>
                        <UserAvatar
                            username={entry.username}
                            avatar={entry.avatar}
                            size="sm"
                            className={cn(isViewer && "ring-2 ring-accent")}
                        />
                        <div className="flex min-w-0 flex-1 flex-col gap-1">
                            <div className="flex items-center gap-2">
                                <Typography type="body-sm" weight="medium" className="line-clamp-1">
                                    {entry.displayName}
                                </Typography>
                                {isViewer ? (
                                    <Chip size="sm" variant="soft" color="accent">
                                        {t("leaderboard.you")}
                                    </Chip>
                                ) : null}
                            </div>
                            <XpSegmentBar entry={entry} />
                        </div>
                        <Typography
                            type="body-sm"
                            weight="semibold"
                            className={cn("shrink-0", isViewer ? "text-accent" : "text-foreground")}
                        >
                            {t("leaderboard.xp", { value: categoryEntryXp(entry, selectedCategory) })}
                        </Typography>
                    </div>
                )
            })}
        </div>
    )
}

/** A thin stacked bar showing a learner's XP split across the three sources. */
const XpSegmentBar = ({ entry }: { entry: LeaderboardEntry }) => {
    const challenge = entry.totalScore
    const reading = entry.lessonsRead * READING_XP
    const milestone = entry.milestoneProgress * MILESTONE_XP
    const total = challenge + reading + milestone
    if (total <= 0) {
        return <div className="h-1.5 w-4/5 rounded-full bg-default" />
    }
    const segments: Array<{ key: "challenges" | "reading" | "milestones"; value: number }> = [
        { key: "challenges", value: challenge },
        { key: "reading", value: reading },
        { key: "milestones", value: milestone },
    ]
    return (
        <div aria-hidden className="flex h-1.5 w-4/5 overflow-hidden rounded-full bg-default">
            {segments.map((segment) => (
                <div
                    key={segment.key}
                    style={{ width: `${(segment.value / total) * 100}%`, backgroundColor: CATEGORY_COLOR[segment.key] }}
                />
            ))}
        </div>
    )
}

export default LeaderboardTable
