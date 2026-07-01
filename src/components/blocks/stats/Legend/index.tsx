import React from "react"
import type { ReactNode } from "react"
import { Typography, cn } from "@heroui/react"
import type { WithClassNames } from "@/modules/types/base/class-name"

/** One legend entry: a colour swatch + its label. */
export interface LegendItem {
    /** Stable key. */
    key: string
    /** Label shown next to the swatch. */
    label: ReactNode
    /** Swatch colour (a token string, e.g. `var(--success)`). */
    color: string
}

/** Props for the {@link Legend} block. */
export interface LegendProps extends WithClassNames<undefined> {
    /** Entries to render, in order. */
    items: Array<LegendItem>
}

/**
 * Standalone colour legend — a `flex-wrap` row of `dot + label`, matching the
 * legend a {@link import("@/components/blocks").SegmentBar} renders under itself.
 * Use it to explain the colours of several bars sharing one scale (e.g. the
 * difficulty tones across course rows) with a single legend. Pure/props-only.
 *
 * @param props - {@link LegendProps}
 */
export const Legend = ({ items, className }: LegendProps) => {
    return (
        <div className={cn("flex flex-wrap gap-x-3 gap-y-2", className)}>
            {items.map((item) => (
                <div key={item.key} className="flex items-center gap-2">
                    <span
                        aria-hidden
                        style={{ backgroundColor: item.color }}
                        className="size-2.5 shrink-0 rounded-full"
                    />
                    <Typography type="body-xs" color="muted">
                        {item.label}
                    </Typography>
                </div>
            ))}
        </div>
    )
}
