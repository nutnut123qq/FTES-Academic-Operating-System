"use client"

import React, { PropsWithChildren, ReactNode } from "react"
import { cn } from "@heroui/react"

/** Props for {@link LearnShell}. */
export interface LearnShellProps extends PropsWithChildren {
    /**
     * The persistent left content rail (the course content-map / milestone /
     * leaderboard-category rail), supplied by the route layout. Owns its own width
     * + sticky behaviour; omit for rail-less surfaces (mind-map, dashboard).
     */
    leftRail?: ReactNode
    /**
     * The right rail (on-this-page outline), supplied by the route layout on the
     * lesson reader only. When omitted the content spans full width.
     */
    rightRail?: ReactNode
    /**
     * Opt out of the shell's canonical `p-6` reading-column padding for full-bleed
     * routes (the mind-map canvas fills the padding itself). Defaults to `false`.
     */
    fullBleed?: boolean
    /** Extra classes on the shell root. */
    className?: string
}

/**
 * Faithful port of StarCI's `LearnShell`. Lays the learn surfaces out as a
 * horizontal flow from `lg` up: an optional left content rail, the reading
 * column (the shell owns the canonical `p-6`), and an optional right outline
 * rail. Below `lg` it collapses to a single column and the rails are supplied
 * elsewhere (they self-hide on mobile).
 *
 * The route `layout.tsx` decides which rails to slot per sub-route (content-map
 * on the reader, leaderboard-category rail on the board, none on the mind-map),
 * mirroring StarCI's layout-owned rails instead of each feature re-declaring its
 * own grid.
 *
 * @param props - {@link LearnShellProps}
 */
export const LearnShell = ({
    children,
    leftRail,
    rightRail,
    fullBleed = false,
    className,
}: LearnShellProps) => (
    <div className={cn("flex w-full flex-col items-start lg:flex-row", className)}>
        {/* persistent left content rail supplied by the layout (self-sizing) */}
        {leftRail}
        {/* reading column — the shell owns the canonical p-6 for every learn page
            (features supply only max-w + mx-auto + gap), except full-bleed routes */}
        <div
            className={cn(
                "min-h-0 w-full min-w-0 flex-1 lg:w-auto",
                !fullBleed && "p-6",
            )}
        >
            {children}
        </div>
        {/* right outline rail (on-this-page) supplied by the layout */}
        {rightRail}
    </div>
)

export default LearnShell
