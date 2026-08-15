import React from "react"
import {
    useSeededParticles,
} from "../useSeededParticles"
import type {
    ParticleEffectProps,
} from "./SnowEffect"

/**
 * A twinkling starfield scattered across the viewport, tinted by the accent
 * colour. Motion-free (opacity pulse only).
 * @param props - {@link ParticleEffectProps}
 */
export const StarsEffect = ({ count = 70 }: ParticleEffectProps) => {
    const particles = useSeededParticles(count, 71)
    return (
        <>
            {particles.map((particle) => (
                <span
                    key={particle.index}
                    className="ambient-star absolute rounded-full"
                    style={{
                        left: `${particle.left}%`,
                        top: `${particle.top}%`,
                        width: `${Math.max(1, particle.size - 2)}px`,
                        height: `${Math.max(1, particle.size - 2)}px`,
                        background: "var(--accent)",
                        animation: `starTwinkle ${particle.duration / 2 + 1.5}s ease-in-out infinite ${particle.delay}s`,
                    }}
                />
            ))}
        </>
    )
}
