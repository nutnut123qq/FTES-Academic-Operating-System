"use client"

import React from "react"
import { cn } from "@heroui/react"
import type { WithClassNames } from "@/modules/types/base/class-name"
import {
    buildHeatmapCells,
    XP_LEVEL_CLASS,
} from "@/components/features/gamification/StreakHeatmap/model"
import type { PublicActivityDay } from "../../hooks/useQueryPublicActivitySwr"

/** Props for {@link ProfileActivityGrid}. */
export interface ProfileActivityGridProps extends WithClassNames<undefined> {
    /** Sparse per-day event counts (only days with ≥1 event). */
    days: ReadonlyArray<PublicActivityDay>
    /** Whole weeks ending today to draw — the caller's PROVEN coverage, never more. */
    weeks: number
    /** Accessible label per cell — the owner localizes (date + count). */
    cellLabel: (day: PublicActivityDay) => string
}

/**
 * Maps a day's EVENT COUNT to an intensity tier (0–3).
 *
 * Deliberately NOT the streak heatmap's `xpLevel`: that one buckets XP (1–19 / 20–49 /
 * 50+), and raw activity counts are an order of magnitude smaller, so reusing it would
 * flatten every active day onto tier 1. Buckets here: `0` none · `1` 1 · `2` 2–4 · `3` 5+.
 */
export const countLevel = (count: number): number => {
    if (count <= 0) return 0
    if (count === 1) return 1
    if (count < 5) return 2
    return 3
}

/**
 * Contribution-style activity grid for a public profile — a 7-row × `weeks`-column
 * calendar ending on today's Vietnam day, shaded by how many activity events landed on
 * each day.
 *
 * Window filling + the Vietnam-day arithmetic are reused from the streak heatmap's pure
 * model (`buildHeatmapCells`), so both grids agree on which cell is "today". Only the
 * intensity scale differs ({@link countLevel} vs the XP one) — see its docblock.
 *
 * `weeks` is supplied by the caller as PROVEN coverage: an un-shaded cell here asserts
 * "no activity that day", so the grid must never extend past the range the data actually
 * covers. Pure block — no fetching, no store.
 *
 * @param props - {@link ProfileActivityGridProps}
 */
export const ProfileActivityGrid = ({
    days,
    weeks,
    cellLabel,
    className,
}: ProfileActivityGridProps) => {
    // reuse the streak model's dense-window fill; its `xp` slot carries the event count
    const cells = buildHeatmapCells(
        days.map((day) => ({ date: day.date, xp: day.count })),
        weeks,
    )
    const columns: Array<Array<{ date: string; xp: number }>> = []
    for (let index = 0; index < cells.length; index += 7) {
        columns.push(cells.slice(index, index + 7))
    }

    return (
        <div className={cn("flex gap-[3px] overflow-x-auto", className)} role="grid">
            {columns.map((week, weekIndex) => (
                <div key={weekIndex} role="row" className="flex flex-col gap-[3px]">
                    {week.map((cell) => {
                        const label = cellLabel({ date: cell.date, count: cell.xp })
                        return (
                            <span
                                key={cell.date}
                                role="gridcell"
                                aria-label={label}
                                title={label}
                                className={cn(
                                    "size-3 shrink-0 rounded-sm",
                                    XP_LEVEL_CLASS[countLevel(cell.xp)],
                                )}
                            />
                        )
                    })}
                </div>
            ))}
        </div>
    )
}
