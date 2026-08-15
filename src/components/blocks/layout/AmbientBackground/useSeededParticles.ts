import {
    useMemo,
} from "react"

/** One particle's deterministic layout + timing. */
export interface SeededParticle {
    /** Stable React key / seed index. */
    index: number
    /** Horizontal position, % of viewport width. */
    left: number
    /** Vertical position, % of viewport height (only used by scattered effects). */
    top: number
    /** Size in px. */
    size: number
    /** Animation duration in seconds. */
    duration: number
    /** Animation start delay in seconds. */
    delay: number
    /** Horizontal wander over the animation, px (fed to a `--drift` keyframe var). */
    drift: number
}

/**
 * Deterministic pseudo-random particle layout — seeded by index (+ an optional
 * salt so sibling effects don't share identical layouts), so server + client
 * markup always match (no hydration mismatch, no `Math.random` at render).
 *
 * @param count - how many particles to generate.
 * @param salt - seed offset so different effects don't produce identical layouts.
 * @returns the deterministic particle list.
 */
export const useSeededParticles = (
    count: number,
    salt = 0,
): Array<SeededParticle> =>
    useMemo(
        () =>
            Array.from({ length: count }).map((_, index) => {
                // three cheap hash streams → stable pseudo-random per particle
                const seed = (((index + salt) * 2654435761) % 1000) / 1000
                const seed2 = (((index + salt) * 40503) % 997) / 997
                const seed3 = (((index + salt) * 15485867) % 991) / 991
                return {
                    index,
                    left: Math.round(seed * 100),
                    top: Math.round(seed3 * 100),
                    size: 2 + Math.round(seed2 * 4),
                    duration: 8 + Math.round(seed * 10),
                    delay: Math.round(seed2 * 100) / 10,
                    drift: Math.round((seed - 0.5) * 80),
                }
            }),
        [count, salt],
    )
