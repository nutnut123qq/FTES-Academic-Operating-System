import React from "react"
import { cn } from "@heroui/react"
import type { WithClassNames } from "@/modules/types/base/class-name"

/** Props for {@link LevelRing}. */
export interface LevelRingProps extends WithClassNames<undefined> {
    /** Progress toward the next level, in `[0, 1]`. */
    progress: number
    /** Current level number shown in the badge; omit to hide (loading/guest). */
    level?: number
    /** Accessible description of the ring (level + progress). */
    label: string
    /** The wrapped avatar. */
    children: React.ReactNode
}

/** SVG geometry: 44px box wrapping the size-9 (36px) avatar. */
const RING_RADIUS = 20
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS

/**
 * Level progress ring wrapped around the account-menu avatar: an SVG circle
 * whose arc fill equals the progress toward the next level, plus a small level
 * badge pinned to the bottom edge. Presentational — progress/level via props.
 *
 * @param props - {@link LevelRingProps}
 */
export const LevelRing = ({ progress, level, label, children, className }: LevelRingProps) => {
    const clamped = Math.max(0, Math.min(1, progress))
    return (
        <div
            role="img"
            aria-label={label}
            className={cn("relative inline-flex size-11 shrink-0 items-center justify-center", className)}
        >
            <svg viewBox="0 0 44 44" aria-hidden focusable="false" className="absolute inset-0 size-full -rotate-90">
                <circle cx="22" cy="22" r={RING_RADIUS} fill="none" strokeWidth="2.5" className="stroke-default" />
                <circle
                    cx="22"
                    cy="22"
                    r={RING_RADIUS}
                    fill="none"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeDasharray={`${clamped * RING_CIRCUMFERENCE} ${RING_CIRCUMFERENCE}`}
                    className="stroke-accent"
                />
            </svg>
            {children}
            {level !== undefined ? (
                <span
                    aria-hidden
                    className="absolute -bottom-1 left-1/2 -translate-x-1/2 rounded-full bg-accent px-1 text-xs font-bold leading-4 text-accent-foreground"
                >
                    {level}
                </span>
            ) : null}
        </div>
    )
}
