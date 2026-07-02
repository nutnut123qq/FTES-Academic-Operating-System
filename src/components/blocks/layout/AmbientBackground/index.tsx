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
import type {
    EffectDirection,
} from "@/resources/constants/appearance"

/** Props for {@link AmbientBackground}. */
export interface AmbientBackgroundProps extends WithClassNames<undefined> {
    /** How many sparks to spawn (default 60). Lower it on weak devices. */
    count?: number
    /**
     * Motion direction: `"rise"` = round embers drifting up from the bottom
     * (the original behaviour), `"fall"` = elongated meteor streaks with a comet
     * tail dropping from the top (default — the new app default).
     */
    direction?: EffectDirection
}

/** A single spark's deterministic layout + timing. */
interface Spark {
    /** Stable React key / seed index. */
    index: number
    /** Horizontal start, % of viewport width. */
    left: number
    /** Diameter in px. */
    size: number
    /** Rise/fall duration in seconds. */
    duration: number
    /** Animation start delay in seconds. */
    delay: number
    /** Horizontal wander over the travel, px (fed to the `--drift` keyframe var). */
    drift: number
}

/**
 * App-wide ambient background — a faint accent glow hugging one viewport edge plus
 * a field of sparks: embers drifting slowly upward (`direction="rise"`) or meteor
 * streaks with a comet tail falling from the top (`direction="fall"`, default).
 * Sits `fixed inset-0` behind everything (negative z-index, non-interactive) so it
 * stays put while the page scrolls.
 *
 * Pure presenter: owns all of its style, takes no store/data — `InnerLayout` reads
 * the appearance store and passes `direction` down. Colours come from the
 * `--accent` token so it tracks the selected accent + light/dark automatically;
 * the keyframes (`emberRise`, `meteorFall`) + reduced-motion guard live in
 * `globals.css`. Sparks are laid out deterministically (seeded by index) so
 * server + client markup match — no hydration mismatch and no `Math.random`
 * at render.
 *
 * @param props - optional className (placement), spark `count`, and `direction`.
 */
export const AmbientBackground = ({
    className,
    count = 60,
    direction = "fall",
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

    const isFall = direction === "fall"

    return (
        <div
            aria-hidden="true"
            className={cn(
                "pointer-events-none fixed inset-0 -z-10 overflow-hidden",
                className,
            )}
        >
            {/* warm glow pooled at the departure edge (bottom for rise, top for fall) */}
            <div
                className={cn(
                    "absolute inset-x-0 h-2/3",
                    isFall ? "top-0" : "bottom-0",
                )}
                style={{
                    background: isFall
                        ? "radial-gradient(120% 80% at 50% -20%, color-mix(in oklch, var(--accent) 30%, transparent), transparent 70%)"
                        : "radial-gradient(120% 80% at 50% 120%, color-mix(in oklch, var(--accent) 30%, transparent), transparent 70%)",
                }}
            />

            {/* rising embers or falling meteors — same deterministic spark field */}
            {sparks.map((spark) => {
                if (!isFall) {
                    return (
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
                    )
                }
                // lean the streak into its trajectory: atan(drift / ~fall distance),
                // negated because a positive CSS rotation tips the head the other way.
                // Deterministic from the seeded drift → still hydration-safe.
                const tilt =
                    Math.round((-Math.atan2(spark.drift, 900) * 180 * 10) / Math.PI) / 10
                return (
                    <span
                        key={spark.index}
                        className="ambient-meteor absolute top-0 rounded-full"
                        style={{
                            left: `${spark.left}%`,
                            width: `${spark.size}px`,
                            height: `${spark.size * 7}px`,
                            // bright head at the bottom (leading the fall), comet tail
                            // fading upward — opposite the direction of travel
                            background:
                                "linear-gradient(to top, var(--accent), transparent)",
                            // wander + precomputed lean consumed by the meteorFall keyframe
                            ["--drift" as string]: `${spark.drift}px`,
                            ["--tilt" as string]: `${tilt}deg`,
                            animation: `meteorFall ${spark.duration}s linear infinite ${spark.delay}s`,
                            opacity: 0,
                        }}
                    />
                )
            })}
        </div>
    )
}
