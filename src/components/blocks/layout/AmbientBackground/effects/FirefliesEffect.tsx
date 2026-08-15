import React from "react"
import {
    useSeededParticles,
} from "../useSeededParticles"
import type {
    ParticleEffectProps,
} from "./SnowEffect"

/**
 * Slow-drifting fireflies scattered across the viewport that flicker in and out,
 * tinted by the accent colour.
 * @param props - {@link ParticleEffectProps}
 */
export const FirefliesEffect = ({ count = 24 }: ParticleEffectProps) => {
    const particles = useSeededParticles(count, 53)
    return (
        <>
            {particles.map((particle) => (
                <span
                    key={particle.index}
                    className="ambient-firefly absolute rounded-full"
                    style={{
                        left: `${particle.left}%`,
                        top: `${particle.top}%`,
                        width: `${particle.size}px`,
                        height: `${particle.size}px`,
                        background: "var(--accent)",
                        boxShadow: `0 0 ${particle.size * 2.5}px var(--accent)`,
                        ["--drift" as string]: `${particle.drift}px`,
                        animation: `fireflyDrift ${particle.duration + 2}s ease-in-out infinite ${particle.delay}s`,
                    }}
                />
            ))}
        </>
    )
}
