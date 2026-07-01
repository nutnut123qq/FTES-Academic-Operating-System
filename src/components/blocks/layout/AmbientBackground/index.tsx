"use client"

import React, {
    useMemo,
} from "react"
import {
    cn,
} from "@heroui/react"
import type {
    WithClassNames,
} from "@/modules/types/base/class-name"

/** Props for {@link AmbientBackground}. */
export interface AmbientBackgroundProps extends WithClassNames<undefined> {
    /** How many sparks to spawn (default 60). Lower it on weak devices. */
    count?: number
}

/** A single spark's deterministic layout + timing. */
interface Spark {
    /** Stable React key / seed index. */
    index: number
    /** Horizontal start, % of viewport width. */
    left: number
    /** Diameter in px. */
    size: number
    /** Rise duration in seconds. */
    duration: number
    /** Animation start delay in seconds. */
    delay: number
    /** Horizontal wander over the rise, px (fed to the `--drift` keyframe var). */
    drift: number
}

/**
 * App-wide ambient background — a faint brand-pink glow hugging the bottom plus a
 * field of embers drifting slowly upward. Sits `fixed inset-0` behind everything
 * (negative z-index, non-interactive) so it stays put while the page scrolls.
 *
 * Pure presenter: owns all of its style, takes no store/data. Colours come from
 * the `--accent` token so it tracks light/dark automatically; the keyframe
 * (`emberRise`) + reduced-motion guard live in `globals.css`. Sparks are laid out
 * deterministically (seeded by index) so server + client markup match — no
 * hydration mismatch and no `Math.random` at render.
 *
 * @param props - optional className (placement) + spark `count`.
 */
export const AmbientBackground = ({
    className,
    count = 60,
}: AmbientBackgroundProps) => {
    const sparks = useMemo<Array<Spark>>(
        () =>
            Array.from({ length: count }).map((_, index) => {
                // two cheap hash streams → stable pseudo-random per spark
                const seed = ((index * 2654435761) % 1000) / 1000
                const seed2 = ((index * 40503) % 997) / 997
                return {
                    index,
                    left: Math.round(seed * 100),
                    size: 2 + Math.round(seed2 * 4),
                    duration: 8 + Math.round(seed * 10),
                    delay: Math.round(seed2 * 100) / 10,
                    drift: Math.round((seed - 0.5) * 80),
                }
            }),
        [count],
    )

    return (
        <div
            aria-hidden="true"
            className={cn(
                "pointer-events-none fixed inset-0 -z-10 overflow-hidden",
                className,
            )}
        >
            {/* warm glow pooled at the bottom edge */}
            <div
                className="absolute inset-x-0 bottom-0 h-2/3"
                style={{
                    background:
                        "radial-gradient(120% 80% at 50% 120%, color-mix(in oklch, var(--accent) 30%, transparent), transparent 70%)",
                }}
            />

            {/* rising sparks */}
            {sparks.map((spark) => (
                <span
                    key={spark.index}
                    className="ambient-ember absolute bottom-0 rounded-full"
                    style={{
                        left: `${spark.left}%`,
                        width: `${spark.size}px`,
                        height: `${spark.size}px`,
                        background: "var(--accent)",
                        boxShadow: `0 0 ${spark.size * 2}px var(--accent)`,
                        // horizontal wander consumed by the emberRise keyframe
                        ["--drift" as string]: `${spark.drift}px`,
                        animation: `emberRise ${spark.duration}s linear infinite ${spark.delay}s`,
                        opacity: 0,
                    }}
                />
            ))}
        </div>
    )
}
