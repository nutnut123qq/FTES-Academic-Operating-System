import React from "react"
import {
    useSeededParticles,
} from "../useSeededParticles"
import type {
    ParticleEffectProps,
} from "./SnowEffect"

/**
 * Thin rain streaks falling fast, tilted, tinted by the accent colour.
 * @param props - {@link ParticleEffectProps}
 */
export const RainEffect = ({ count = 45 }: ParticleEffectProps) => {
    const particles = useSeededParticles(count, 23)
    return (
        <>
            {particles.map((particle) => (
                <span
                    key={particle.index}
                    className="ambient-rain absolute top-0"
                    style={{
                        left: `${particle.left}%`,
                        width: "1.5px",
                        height: `${16 + particle.size * 4}px`,
                        background:
                            "linear-gradient(to bottom, transparent, var(--accent), transparent)",
                        animation: `rainFall ${1.4 + (particle.duration % 4) / 3}s linear infinite ${particle.delay / 2}s`,
                        opacity: 0,
                    }}
                />
            ))}
        </>
    )
}
