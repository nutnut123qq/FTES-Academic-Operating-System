"use client"

import React from "react"
import { cn } from "@heroui/react"
import type { WithClassNames } from "@/modules/types/base/class-name"
import {
    buildHeatmapCells,
    HEATMAP_WEEKS,
    XP_LEVEL_CLASS,
    xpLevel,
    type HeatmapCell,
} from "./model"

export type { HeatmapCell } from "./model"
export { HEATMAP_WEEKS } from "./model"

/** Props for {@link StreakHeatmap}. */
export interface StreakHeatmapProps extends WithClassNames<undefined> {
    /**
     * Sparse per-day XP rows from the backend (`{ date, xp }`, any order). The
     * component fills the full `weeks × 7` window itself — absent dates render as
     * empty cells.
     */
    days: ReadonlyArray<HeatmapCell>
    /** Window size in weeks (default {@link HEATMAP_WEEKS}). */
    weeks?: number
    /**
     * Optional accessible label per cell — `(cell) => string`. The owner
     * localizes (date + XP). When omitted the cell carries no label.
     */
    cellLabel?: (cell: HeatmapCell) => string
}

/**
 * 12-week streak activity heatmap — a 7-row × `weeks`-column grid. Each cell is
 * shaded by its XP intensity tier ({@link xpLevel}) via the `--heat-*` tokens and
 * carries an optional `aria-label` (via `cellLabel`) so a screen reader reads the
 * date + XP. Data is a SPARSE `{ date, xp }[]`; the block fills the dense window
 * (ending on today's Vietnam day) itself, so callers pass only the backend rows.
 * Pure block: no hooks besides `cn`.
 *
 * @param props - {@link StreakHeatmapProps}
 */
export const StreakHeatmap = ({ days, weeks = HEATMAP_WEEKS, cellLabel, className }: StreakHeatmapProps) => {
    const cells = buildHeatmapCells(days, weeks)
    // Chunk the flat oldest→newest list into 7-day week columns.
    const columns: Array<Array<HeatmapCell>> = []
    for (let i = 0; i < cells.length; i += 7) {
        columns.push(cells.slice(i, i + 7))
    }
    return (
        <div className={cn("flex gap-[3px]", className)} role="grid">
            {columns.map((week, weekIndex) => (
                <div key={weekIndex} role="row" className="flex flex-col gap-[3px]">
                    {week.map((cell) => {
                        const label = cellLabel?.(cell)
                        return (
                            <span
                                key={cell.date}
                                role="gridcell"
                                aria-label={label}
                                title={label}
                                className={cn("size-3 shrink-0 rounded-sm", XP_LEVEL_CLASS[xpLevel(cell.xp)])}
                            />
                        )
                    })}
                </div>
            ))}
        </div>
    )
}
