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
     * (`fall` = 40, `rise` = 60). Lower it on weak devices.
     */
    count?: number
    /**
     * Motion direction: `"rise"` = round embers drifting up from the bottom
     * (the original behaviour), `"fall"` = elongated meteor streaks shooting
     * diagonally (top-left → bottom-right) with a comet tail (default — the new
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
    /** Horizontal wander over the travel — vw on fall, px on rise (fed to `--drift`). */
    drift: number
}

/**
 * App-wide ambient background — a faint accent glow hugging one viewport edge plus
 * a field of sparks: embers drifting slowly upward (`direction="rise"`) or a
 * meteor shower of comet-tailed streaks shooting diagonally top-left → bottom-right
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
                // three cheap hash streams → stable pseudo-random per spark
                const seed = ((index * 2654435761) % 1000) / 1000
                const seed2 = ((index * 40503) % 997) / 997
                const seed3 = ((index * 71993) % 1009) / 1009
                // Fall = a brisk, decisive shooting-star drop (~4–7s base) leaning
                // to the RIGHT: drift +35..+60vw over ~125vh gives a ~26–40°
                // diagonal (top-left → bottom-right) that reads as a real streak,
                // not a near-vertical drop. Rise keeps its slow upward wander
                // (~8–18s, gentle L/R drift in px).
                const duration = isFall
                    ? 4 + Math.round(seed * 3)
                    : 8 + Math.round(seed * 10)
                const drift = isFall
                    ? 35 + Math.round(seed * 25)
                    : Math.round((seed - 0.5) * 80)
                return {
                    index,
                    // Fall starts spread past the LEFT edge (−35..100%) so that after
                    // the rightward drift the bottom half is covered edge-to-edge —
                    // 0..100% starts would leave the bottom-left corner empty.
                    // (seed3 keeps start x decorrelated from drift/size/delay.)
                    left: isFall
                        ? Math.round(seed3 * 135) - 35
                        : Math.round(seed * 100),
                    size: 2 + Math.round(seed2 * 4),
                    duration,
                    delay: Math.round(seed2 * 100) / 10,
                    drift,
                }
            }),
        [sparkCount, isFall],
    )

    // Keep the meteor field OUT of the central content column: the house style is
    // glassmorphism (bg-surface/60, bg-default/20, border-only cards), so streaks
    // behind those translucent surfaces show straight through and read as if they
    // were painted on top of the content. A horizontal mask fades the whole layer
    // out across the content band (max-w-6xl = 1152px + breathing room) and keeps
    // it fully visible only in the side margins. px-based around 50% so it tracks
    // the real centered column, not viewport percentages; on narrow screens the
    // margins vanish and the effect fades out entirely — accepted trade-off.
    // Rise (bottom-center glow + full-field embers) keeps its original unmasked look.
    const fallMask = isFall
        ? "linear-gradient(to right, black, black calc(50% - 760px), transparent calc(50% - 600px), transparent calc(50% + 600px), black calc(50% + 760px), black)"
        : undefined

    return (
        <div
            aria-hidden="true"
            className={cn(
                "pointer-events-none fixed inset-0 -z-10 overflow-hidden",
                className,
            )}
            style={{
                WebkitMaskImage: fallMask,
                maskImage: fallMask,
            }}
        >
            {/* warm glow pooled at the departure corner/edge: top-left for fall
                (the meteor shower's source), bottom for rise */}
            <div
                className={cn(
                    "absolute inset-x-0 h-2/3",
                    isFall ? "top-0" : "bottom-0",
                )}
                style={{
                    background: isFall
                        ? "radial-gradient(120% 80% at 0% -20%, color-mix(in oklch, var(--accent) 30%, transparent), transparent 70%)"
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
                // the spark travels Δx ≈ drift vw (×16px on a ~1600px viewport) over
                // Δy ≈ 125vh (~1125px). CSS rotate(+θ) swings the bar's bottom (the
                // bright head) to the LEFT, so aligning the head with the rightward
                // travel needs θ = −atan2(Δx, Δy) — negative angle, head bottom-right,
                // tail up-left, matching the top-left → bottom-right path.
                // Deterministic → hydration-safe.
                const tilt =
                    -Math.round((Math.atan2(spark.drift * 16, 1125) * 180 * 10) / Math.PI) / 10
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
                            ["--drift" as string]: `${spark.drift}vw`,
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
