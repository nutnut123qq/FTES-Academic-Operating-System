"use client"

import React from "react"
import { Chip, Typography, cn } from "@heroui/react"
import { useTranslations } from "next-intl"
import { CrownIcon } from "@phosphor-icons/react"
import {
    CATEGORY_COLOR,
    MILESTONE_XP,
    READING_XP,
    categoryEntryXp,
    type LeaderboardCategoryKey,
    type RankedLeaderboardEntry,
} from "../categories"
import { UserAvatar } from "@/components/reuseable/UserAvatar"
import type { WithClassNames } from "@/modules/types/base/class-name"

/** Props for {@link XpSegmentBar}. */
interface XpSegmentBarProps {
    /** Challenge XP (1:1 with score). */
    challenge: number
    /** Reading XP (lessons × {@link READING_XP}). */
    reading: number
    /** Milestone XP (tasks × {@link MILESTONE_XP}). */
    milestone: number
}

/** A thin stacked bar showing how an entry's total XP splits across categories. */
const XpSegmentBar = ({ challenge, reading, milestone }: XpSegmentBarProps) => {
    const sum = challenge + reading + milestone
    if (sum <= 0) {
        return <div className="h-1.5 w-4/5 rounded-full bg-default" />
    }
    const segment = (value: number, color: string) =>
        value > 0
            ? <span style={{ width: `${(value / sum) * 100}%`, backgroundColor: color }} />
            : null
    return (
        <div className="flex h-1.5 w-4/5 overflow-hidden rounded-full" aria-hidden>
            {segment(challenge, CATEGORY_COLOR.challenge)}
            {segment(reading, CATEGORY_COLOR.reading)}
            {segment(milestone, CATEGORY_COLOR.milestone)}
        </div>
    )
}

/** Props for {@link LeaderboardTable}. */
export interface LeaderboardTableProps extends WithClassNames<undefined> {
    /** Rows to render, already ranked under the selected category. */
    rankedEntries: Array<RankedLeaderboardEntry>
    /** Category currently driving the rank + the value shown on the right. */
    selectedCategory: LeaderboardCategoryKey
    /** Current viewer's user id — highlights their row. */
    viewerUserId?: string | null
}

/**
 * Ranked rows of the board: position (crown on #1), learner (avatar + name, "You"
 * chip on the viewer's own row), a stacked XP-composition bar, and the XP value for
 * the selected category. Re-ranks instantly when the category changes. Renders
 * nothing when there are no rows.
 * @param props - {@link LeaderboardTableProps}
 */
export const LeaderboardTable = ({
    rankedEntries,
    selectedCategory,
    viewerUserId,
    className,
}: LeaderboardTableProps) => {
    const t = useTranslations()
    if (rankedEntries.length === 0) {
        return null
    }

    return (
        <div className={cn("flex flex-col gap-0.5", className)}>
            {rankedEntries.map(({ entry, displayRank }) => {
                const isViewer = !!viewerUserId && entry.userId === viewerUserId
                return (
                    <div
                        key={entry.enrollmentId}
                        className="flex items-center gap-3 rounded-2xl px-2 py-2 transition-colors hover:bg-default-50"
                    >
                        {/* rank position — crown on the leader */}
                        <div className="flex w-5 shrink-0 justify-center">
                            {displayRank === 1 ? (
                                <CrownIcon aria-hidden focusable="false" className="size-5 text-warning" />
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
                        {/* learner name + XP-composition bar */}
                        <div className="flex min-w-0 flex-1 flex-col gap-1">
                            <div className="flex items-center gap-2">
                                <Typography type="body-sm" weight="medium" className="line-clamp-1">
                                    {entry.username}
                                </Typography>
                                {isViewer && (
                                    <Chip size="sm" variant="soft" color="accent">
                                        {t("leaderboard.you")}
                                    </Chip>
                                )}
                            </div>
                            <XpSegmentBar
                                challenge={entry.totalScore}
                                reading={entry.lessonsRead * READING_XP}
                                milestone={entry.milestoneProgress * MILESTONE_XP}
                            />
                        </div>
                        {/* XP value for the selected category — accent only on the viewer's row */}
                        <Typography
                            type="body-sm"
                            weight="semibold"
                            className={cn("shrink-0", isViewer ? "text-accent" : "text-foreground")}
                        >
                            {t("leaderboard.xp", { xp: categoryEntryXp(entry, selectedCategory) })}
                        </Typography>
                    </div>
                )
            })}
        </div>
    )
}
