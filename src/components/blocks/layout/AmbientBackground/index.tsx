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
import {
    SPARK_COUNT,
    SPEED_FACTOR,
} from "@/resources/constants/appearance"
import type {
    EffectDirection,
    EffectSpeed,
} from "@/resources/constants/appearance"

/** Props for {@link AmbientBackground}. */
export interface AmbientBackgroundProps extends WithClassNames<undefined> {
    /**
     * Override the spark count. When omitted it is derived from `direction`
     * (`fall` = 120 for a dense meteor shower, `rise` = 60). Lower it on weak
     * devices.
     */
    count?: number
    /**
     * Motion direction: `"rise"` = round embers drifting up from the bottom
     * (the original behaviour), `"fall"` = elongated meteor streaks shooting
     * diagonally (top-right → bottom-left) with a comet tail (default — the new
     * app default).
     */
    direction?: EffectDirection
    /**
     * Speed tier — multiplies every spark's base animation duration via
     * `SPEED_FACTOR` (`slow` ×1.6, `normal` ×1.0, `fast` ×0.55). Default
     * `"normal"`. Reduced-motion still fully disables the effect regardless.
     */
    speed?: EffectSpeed
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
 * a field of sparks: embers drifting slowly upward (`direction="rise"`) or a dense
 * meteor shower of comet-tailed streaks shooting diagonally top-right → bottom-left
 * (`direction="fall"`, default). `speed` scales every spark's duration.
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
 * @param props - optional className (placement), spark `count`, `direction`,
 *   and `speed`.
 */
export const AmbientBackground = ({
    className,
    count,
    direction = "fall",
    speed = "normal",
}: AmbientBackgroundProps) => {
    const isFall = direction === "fall"
    // Denser field on fall (meteor shower) unless the caller overrides `count`.
    const sparkCount = count ?? SPARK_COUNT[direction]
    // Slow ×1.6 / normal ×1.0 / fast ×0.55 — applied to every spark's base duration.
    const speedFactor = SPEED_FACTOR[speed]

    const sparks = useMemo<Array<Spark>>(
        () =>
            Array.from({ length: sparkCount }).map((_, index) => {
                // two cheap hash streams → stable pseudo-random per spark
                const seed = ((index * 2654435761) % 1000) / 1000
                const seed2 = ((index * 40503) % 997) / 997
                // Fall = a brisk, decisive shooting-star drop (~4–7s base) leaning
                // hard to the LEFT: drift −500..−900px over ~125vh gives a ~29–45°
                // diagonal (canonical top-right → bottom-left) that reads as a real
                // streak, not a near-vertical drop.
                // Rise keeps its slow upward wander (~8–18s, gentle L/R drift).
                const duration = isFall
                    ? 4 + Math.round(seed * 3)
                    : 8 + Math.round(seed * 10)
                const drift = isFall
                    ? -(500 + Math.round(seed * 400))
                    : Math.round((seed - 0.5) * 80)
                return {
                    index,
                    left: Math.round(seed * 100),
                    size: 2 + Math.round(seed2 * 4),
                    duration,
                    delay: Math.round(seed2 * 100) / 10,
                    drift,
                }
            }),
        [sparkCount, isFall],
    )

    return (
        <div
            aria-hidden="true"
            className={cn(
                "pointer-events-none fixed inset-0 -z-10 overflow-hidden",
                className,
            )}
        >
            {/* warm glow pooled at the departure corner/edge: top-right for fall
                (the meteor shower's source), bottom for rise */}
            <div
                className={cn(
                    "absolute inset-x-0 h-2/3",
                    isFall ? "top-0" : "bottom-0",
                )}
                style={{
                    background: isFall
                        ? "radial-gradient(120% 80% at 100% -20%, color-mix(in oklch, var(--accent) 30%, transparent), transparent 70%)"
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
                                animation: `emberRise ${(spark.duration * speedFactor).toFixed(2)}s linear infinite ${spark.delay}s`,
                                opacity: 0,
                            }}
                        />
                    )
                }
                // Align the streak's long axis with its real diagonal velocity:
                // the spark travels (Δx = drift px, Δy ≈ one viewport ≈ 900px) so the
                // tail must lean by atan2(Δx, Δy). With drift negative (leftward) this
                // yields a negative angle → head swings toward bottom-left, tail up-right,
                // matching the top-right → bottom-left path. Deterministic → hydration-safe.
                const tilt =
                    Math.round((Math.atan2(spark.drift, 900) * 180 * 10) / Math.PI) / 10
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
                            animation: `meteorFall ${(spark.duration * speedFactor).toFixed(2)}s linear infinite ${spark.delay}s`,
                            opacity: 0,
                        }}
                    />
                )
            })}
        </div>
    )
}
