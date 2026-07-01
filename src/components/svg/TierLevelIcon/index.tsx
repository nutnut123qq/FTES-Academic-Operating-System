import React from "react"
import { cn } from "@heroui/react"
import type { WithClassNames } from "@/modules/types/base/class-name"

/** Props for {@link TierLevelIcon}. */
export interface TierLevelIconProps extends WithClassNames<undefined> {
    /** Active tier level 1–4: how many ascending bars are highlighted. */
    level: number
}

/**
 * Original ascending-bars tier icon (escalating level motif).
 *
 * Renders four rounded bars of increasing height; the first `level` bars are
 * solid, the rest are dimmed — a compact "how powerful is this plan" glyph that
 * scales Free → Max. Inherits color via `currentColor`.
 *
 * @param props - active level + optional className
 */
export const TierLevelIcon = ({
    level,
    className,
}: TierLevelIconProps) => {
    // four ascending bars (x, top-y, height); bottom-aligned at y=21
    const bars = [
        { x: 3, y: 15, height: 6 },
        { x: 8.5, y: 11, height: 10 },
        { x: 14, y: 7, height: 14 },
        { x: 19.5, y: 3, height: 18 },
    ]
    return (
        <svg
            viewBox="0 0 24 24"
            fill="currentColor"
            className={cn(className)}
            aria-hidden="true"
        >
            {bars.map((bar, index) => (
                <rect
                    key={bar.x}
                    x={bar.x}
                    y={bar.y}
                    width={2.5}
                    height={bar.height}
                    rx={1.25}
                    // bars beyond the active level are dimmed
                    opacity={index < level ? 1 : 0.25}
                />
            ))}
        </svg>
    )
}
