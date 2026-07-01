"use client"

import React from "react"
import {
    ChevronUp as CaretUpIcon,
    ChevronDown as CaretDownIcon,
} from "@gravity-ui/icons"
import {
    cn,
} from "@heroui/react"
import type {
    WithClassNames,
} from "@/modules/types/base/class-name"

/** Props for {@link RankDeltaCaret}. */
export interface RankDeltaCaretProps extends WithClassNames<undefined> {
    /**
     * Rank movement vs the previous period (`lastRank - currentRank`): positive
     * = climbed N places (▲ green), negative = dropped (▼ red), 0 = unchanged
     * (muted dash), null = no baseline (renders nothing).
     */
    delta: number | null
}

/**
 * The rank-movement caret shown at the end of a leaderboard row: a green up
 * arrow + count when the user climbed, a red down arrow + count when they
 * dropped, a muted dash when unchanged, and nothing when there's no baseline.
 * Reused by the weekly-league board + the global leaderboard.
 *
 * @param props - {@link RankDeltaCaretProps}
 */
export const RankDeltaCaret = ({
    delta,
    className,
}: RankDeltaCaretProps) => {
    // no last-period baseline → render nothing (keeps the row clean for newcomers)
    if (delta === null) {
        return null
    }
    // unchanged → a muted dash so the column still aligns
    if (delta === 0) {
        return (
            <span className={cn("text-xs text-muted", className)}>
                —
            </span>
        )
    }
    const climbed = delta > 0
    return (
        <span
            className={cn(
                "flex items-center gap-0.5 text-xs font-medium",
                climbed ? "text-success" : "text-danger",
                className,
            )}
        >
            {climbed ? (
                <CaretUpIcon className="size-3.5" />
            ) : (
                <CaretDownIcon className="size-3.5" />
            )}
            {Math.abs(delta)}
        </span>
    )
}
