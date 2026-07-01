import React from "react"
import type { ReactNode } from "react"
import { Typography, cn } from "@heroui/react"
import type { WithClassNames } from "@/modules/types/base/class-name"

/** One slice of a {@link SegmentBar}. */
export interface SegmentBarSegment {
    /** Stable key. */
    key: string
    /** Legend label (the name; the count is appended automatically). */
    label: ReactNode
    /** Raw count — segment width is its share of the total. */
    value: number
    /** CSS colour for the slice + legend dot (e.g. `var(--success)`). Falls back to a palette. */
    color?: string
}

/** Props for the {@link SegmentBar} block. */
export interface SegmentBarProps extends WithClassNames<undefined> {
    /** Slices, in display order. */
    segments: SegmentBarSegment[]
    /** Accessible summary of the whole bar (screen readers read this instead of the slices). */
    ariaLabel: string
    /**
     * Optional denominator. When set, slice widths are `value / max` so the bar
     * fills to the real total (leaving an empty remainder) — use for "progress"
     * (e.g. tasks done out of all tasks). Omit for a pure mix bar that always
     * fills 100% (slices are shares of each other).
     */
    max?: number
    /** Hide the legend row under the bar. */
    hideLegend?: boolean
}

/** Default slice colours (semantic tokens) when a segment has no explicit `color`. */
const PALETTE = [
    "var(--accent)",
    "var(--success)",
    "var(--warning)",
    "var(--danger)",
    "var(--muted)",
]

/**
 * A GitHub-style proportion bar: one thin rounded track split into colour slices
 * sized by each segment's share of the total, with a legend of colour-dot +
 * label + real count below. Honest (widths are true proportions, never
 * relative-to-max) and compact — a single element that flexes a distribution
 * (difficulty depth, language breadth…). Pure/props-only; owns its look.
 *
 * @param props - {@link SegmentBarProps}
 */
export const SegmentBar = ({
    segments,
    ariaLabel,
    max,
    hideLegend,
    className,
}: SegmentBarProps) => {
    const total = max ?? (segments.reduce((acc, segment) => acc + segment.value, 0) || 1)
    const colored = segments.map((segment, index) => ({
        ...segment,
        color: segment.color ?? PALETTE[index % PALETTE.length],
    }))

    return (
        <div className={cn("flex flex-col gap-2", className)}>
            <div
                role="img"
                aria-label={ariaLabel}
                className="flex h-2 w-full overflow-hidden rounded-full bg-default"
            >
                {colored
                    .filter((segment) => segment.value > 0)
                    .map((segment) => (
                        <div
                            key={segment.key}
                            style={{
                                width: `${(segment.value / total) * 100}%`,
                                backgroundColor: segment.color,
                            }}
                        />
                    ))}
            </div>
            {!hideLegend ? (
                <div className="flex flex-wrap gap-x-3 gap-y-2">
                    {colored.map((segment) => (
                        <div key={segment.key} className="flex items-center gap-2">
                            <span
                                aria-hidden
                                style={{ backgroundColor: segment.color }}
                                className="size-2.5 shrink-0 rounded-full"
                            />
                            <Typography type="body-xs" color="muted">
                                {segment.label}&nbsp;·&nbsp;{segment.value}
                            </Typography>
                        </div>
                    ))}
                </div>
            ) : null}
        </div>
    )
}
