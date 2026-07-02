"use client"

import React from "react"
import { cn } from "@heroui/react"
import type { WithClassNames } from "@/modules/types/base/class-name"
import { DayStatus, HEATMAP_WEEKS, type HeatmapDay } from "../engine"

/** Props for {@link StreakHeatmap}. */
export interface StreakHeatmapProps extends WithClassNames<undefined> {
    /** Ordered days (oldest → newest), `HEATMAP_WEEKS × 7` cells. */
    days: Array<HeatmapDay>
    /** Accessible label per cell — `(iso, status) => string`. Owner localizes. */
    cellLabel: (day: HeatmapDay) => string
}

/** Cell fill per status: empty track, brand-pink for active, blue-ish frozen. */
const STATUS_CLASS: Record<DayStatus, string> = {
    [DayStatus.Empty]: "bg-[var(--heat-0)]",
    [DayStatus.Active]: "bg-[var(--heat-4)]",
    [DayStatus.Frozen]: "bg-accent/30 ring-1 ring-inset ring-accent/50",
}

/**
 * 12-week streak activity heatmap — a 7-row × {@link HEATMAP_WEEKS}-column grid.
 * Each cell is coloured by its {@link DayStatus} (empty / active / frozen) and
 * carries an `aria-label` (via `cellLabel`) so a screen reader reads the date +
 * status. Pure block: all data + labels come from props; no hooks besides `cn`.
 *
 * @param props - {@link StreakHeatmapProps}
 */
export const StreakHeatmap = ({ days, cellLabel, className }: StreakHeatmapProps) => {
    // Chunk the flat oldest→newest list into 7-day week columns.
    const weeks: Array<Array<HeatmapDay>> = []
    for (let i = 0; i < days.length; i += 7) {
        weeks.push(days.slice(i, i + 7))
    }
    return (
        <div className={cn("flex gap-[3px]", className)} role="grid">
            {weeks.map((week, weekIndex) => (
                <div key={weekIndex} role="row" className="flex flex-col gap-[3px]">
                    {week.map((day) => (
                        <span
                            key={day.date}
                            role="gridcell"
                            aria-label={cellLabel(day)}
                            title={cellLabel(day)}
                            className={cn("size-3 shrink-0 rounded-sm", STATUS_CLASS[day.status])}
                        />
                    ))}
                </div>
            ))}
        </div>
    )
}
