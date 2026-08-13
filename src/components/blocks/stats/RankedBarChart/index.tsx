import React from "react"
import type { ReactNode } from "react"
import { Typography, cn } from "@heroui/react"
import type { WithClassNames } from "@/modules/types/base/class-name"

/** One row of a {@link RankedBarChart}. */
export interface RankedBarChartBar {
    /** Stable key. */
    key: string
    /** Row label (already translated). */
    label: ReactNode
    /** Raw value — the bar length is its share of the axis maximum. */
    value: number
    /** Printed value; defaults to `value`. Pass a formatted/localised string. */
    valueLabel?: ReactNode
}

/** Props for the {@link RankedBarChart} block. */
export interface RankedBarChartProps extends WithClassNames<undefined> {
    /** Rows, in display order (rank them before passing — the block does not sort). */
    bars: Array<RankedBarChartBar>
    /**
     * Axis maximum. Bar widths are `value / max`, so pass the scale you want the
     * lengths read against. Defaults to the largest bar, i.e. the top row fills the
     * track and the rest are drawn relative to it.
     */
    max?: number
    /**
     * Printed top of the axis (e.g. `"400 EXP"`), rendered under the rows next to a
     * `0`. Pass it whenever `max` is DERIVED from the data — an auto-scaling axis is
     * unreadable unless its top is stated.
     */
    axisMaxLabel?: ReactNode
    /** Printed bottom of the axis. Defaults to `0`. */
    axisMinLabel?: ReactNode
    /** Fill colour for the bars. Defaults to `var(--accent)`. */
    color?: string
}

/**
 * Ranked bar-per-row chart — the house form for a ranked breakdown of ONE metric
 * across a fixed set of buckets (decision log `stat.md`: length/position beats
 * angle/area, and slivers of a stacked bar are unreadable past a few buckets).
 * Each row prints its label and real value above a track/fill bar, so the value is
 * never carried by length alone; all bars share ONE accent colour because colour
 * would encode nothing here. An optional axis footer states the scale, which an
 * auto-scaled (data-derived) maximum needs to stay honest.
 *
 * Pure/props-only; owns its look. The tracks are decorative (`aria-hidden`) — the
 * label + value text of every row is real, readable content.
 *
 * @param props - {@link RankedBarChartProps}
 */
export const RankedBarChart = ({
    bars,
    max,
    axisMaxLabel,
    axisMinLabel = "0",
    color = "var(--accent)",
    className,
}: RankedBarChartProps) => {
    const peak = bars.reduce((highest, bar) => Math.max(highest, bar.value), 0)
    const axisMax = max !== undefined && max > 0 ? max : peak || 1

    return (
        <div className={cn("flex flex-col gap-3", className)}>
            {bars.map((bar) => (
                <div key={bar.key} className="flex flex-col gap-2">
                    <div className="flex items-baseline justify-between gap-3">
                        <Typography type="body-xs" className="min-w-0 truncate">
                            {bar.label}
                        </Typography>
                        <Typography type="body-xs" color="muted" className="shrink-0">
                            {bar.valueLabel ?? bar.value}
                        </Typography>
                    </div>
                    <div aria-hidden className="h-2 w-full overflow-hidden rounded-full bg-default">
                        <div
                            className="h-full rounded-full"
                            style={{
                                width: `${Math.max(0, Math.min(100, (bar.value / axisMax) * 100))}%`,
                                backgroundColor: color,
                            }}
                        />
                    </div>
                </div>
            ))}
            {axisMaxLabel != null ? (
                <div className="flex items-baseline justify-between gap-3">
                    <Typography type="body-xs" color="muted">
                        {axisMinLabel}
                    </Typography>
                    <Typography type="body-xs" color="muted">
                        {axisMaxLabel}
                    </Typography>
                </div>
            ) : null}
        </div>
    )
}
