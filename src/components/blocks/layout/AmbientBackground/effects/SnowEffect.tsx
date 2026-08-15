import React from "react"
import {
    useSeededParticles,
} from "../useSeededParticles"

/** Props shared by the particle-field effects. */
export interface ParticleEffectProps {
    /** How many particles to render. Lower it on weak devices. */
    count?: number
}

/**
 * Snowflakes drifting straight down with a light horizontal wander, tinted by the
 * accent colour.
 * @param props - {@link ParticleEffectProps}
 */
export const SnowEffect = ({ count = 50 }: ParticleEffectProps) => {
    const particles = useSeededParticles(count, 11)
    return (
        <>
            {particles.map((particle) => (
                <span
                    key={particle.index}
                    className="ambient-snow absolute top-0 rounded-full"
                    style={{
                        left: `${particle.left}%`,
                        width: `${particle.size}px`,
                        height: `${particle.size}px`,
                        background: "color-mix(in oklch, var(--accent) 70%, white)",
                        ["--drift" as string]: `${particle.drift}px`,
                        animation: `snowFall ${particle.duration + 4}s linear infinite ${particle.delay}s`,
                        opacity: 0,
                    }}
                />
            ))}
        </>
    )
}
