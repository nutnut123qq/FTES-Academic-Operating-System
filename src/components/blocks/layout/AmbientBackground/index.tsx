"use client"

import React from "react"
import {
    cn,
} from "@heroui/react"
import type {
    WithClassNames,
} from "@/modules/types/base/class-name"
import {
    DEFAULT_BACKGROUND_EFFECT,
} from "@/resources/constants/appearance"
import type {
    BackgroundEffect,
    EffectDirection,
    EffectSpeed,
} from "@/resources/constants/appearance"
import {
    SparkField,
} from "./effects/SparkField"
import {
    WaveEffect,
} from "./effects/WaveEffect"
import {
    SnowEffect,
} from "./effects/SnowEffect"
import {
    RainEffect,
} from "./effects/RainEffect"
import {
    BubblesEffect,
} from "./effects/BubblesEffect"
import {
    FirefliesEffect,
} from "./effects/FirefliesEffect"
import {
    StarsEffect,
} from "./effects/StarsEffect"
import {
    AuroraEffect,
} from "./effects/AuroraEffect"
import {
    CircuitEffect,
} from "./effects/CircuitEffect"

/** Props for {@link AmbientBackground}. */
export interface AmbientBackgroundProps extends WithClassNames<undefined> {
    /**
     * Which ambient effect to render (the user's Settings → Appearance choice).
     * `"none"` renders nothing at all. Defaults to the app's own spark field.
     */
    effect?: BackgroundEffect
    /**
     * Particle count override for every particle-based effect (ember, snow, rain,
     * bubbles, fireflies, stars). Omit for each effect's own tuned count; lower it
     * for small previews or weak devices. The wave / aurora / circuit effects have
     * no particles and ignore it.
     */
    count?: number
    /**
     * Motion direction of the `ember` spark field: `"rise"` = embers drifting up,
     * `"fall"` = meteor streaks (default). Ignored by the other effects.
     */
    direction?: EffectDirection
    /**
     * Speed tier of the `ember` spark field (`slow` ×1.6 / `normal` ×1.0 /
     * `fast` ×0.55). Ignored by the other effects.
     */
    speed?: EffectSpeed
}

/**
 * App-wide ambient background — one of nine decorative effects (Settings →
 * Appearance) sitting `fixed inset-0` behind everything (negative z-index,
 * non-interactive) so it stays put while the page scrolls. Every effect tints
 * from the `--accent` token, so it tracks the user's chosen accent colour
 * automatically; `InnerLayout` hides it entirely on content-dense routes and
 * `globals.css` honours `prefers-reduced-motion` per effect.
 *
 * Pure presenter: owns all of its style, takes no store/data — `InnerLayout`
 * reads the appearance store and passes `effect` (plus the `ember`-only
 * direction/speed) down. Every particle layout is seeded deterministically (see
 * `useSeededParticles` / `SparkField`) so server + client markup match — no
 * hydration mismatch and no `Math.random` at render.
 *
 * @param props - {@link AmbientBackgroundProps}
 */
export const AmbientBackground = ({
    className,
    effect = DEFAULT_BACKGROUND_EFFECT,
    count,
    direction = "fall",
    speed = "normal",
}: AmbientBackgroundProps) => {
    if (effect === "none") {
        return null
    }

    return (
        <div
            aria-hidden="true"
            className={cn(
                "pointer-events-none fixed inset-0 -z-10 overflow-hidden",
                className,
            )}
        >
            {effect === "ember" ? (
                <SparkField count={count} direction={direction} speed={speed} />
            ) : null}
            {effect === "wave" ? <WaveEffect /> : null}
            {effect === "snow" ? <SnowEffect count={count} /> : null}
            {effect === "rain" ? <RainEffect count={count} /> : null}
            {effect === "bubbles" ? <BubblesEffect count={count} /> : null}
            {effect === "fireflies" ? <FirefliesEffect count={count} /> : null}
            {effect === "stars" ? <StarsEffect count={count} /> : null}
            {effect === "aurora" ? <AuroraEffect /> : null}
            {effect === "circuit" ? <CircuitEffect /> : null}
        </div>
    )
}
