"use client"

import React from "react"
import {
    cn,
} from "@heroui/react"
import type {
    WithClassNames,
} from "@/modules/types/base/class-name"

/** A single stat shown in a {@link StatRibbon}. */
export interface StatRibbonItem {
    /** Stable key (also used for React list keys). */
    key: string
    /** The headline value (number or short string). */
    value: React.ReactNode
    /** The muted label under / beside the value. */
    label: React.ReactNode
    /** Optional leading icon. */
    icon?: React.ReactNode
}

/** Props for {@link StatRibbon}. */
export interface StatRibbonProps extends WithClassNames<undefined> {
    /** The stats rendered left to right, separated by vertical dividers. */
    items: ReadonlyArray<StatRibbonItem>
}

/**
 * A horizontal strip of headline stats (icon · big value · muted label) split by
 * vertical dividers — the "flex ribbon" at the top of the profile hero, the left
 * rail, and the dashboard. Wraps gracefully on narrow widths. Presentational:
 * the caller supplies the already-computed values.
 *
 * @param props - {@link StatRibbonProps}
 */
export const StatRibbon = ({
    items,
    className,
}: StatRibbonProps) => {
    return (
        <div className={cn("flex flex-wrap items-center gap-x-6 gap-y-3", className)}>
            {items.map((item, index) => (
                <div
                    key={item.key}
                    className={cn(
                        "flex items-center gap-1.5",
                        // vertical divider before every item except the first
                        index > 0 && "border-l border-default/40 pl-6",
                    )}
                >
                    {item.icon ? (
                        <span className="text-muted">{item.icon}</span>
                    ) : null}
                    <span className="text-xl font-bold leading-none text-foreground">
                        {item.value}
                    </span>
                    <span className="text-xs text-muted">{item.label}</span>
                </div>
            ))}
        </div>
    )
}
