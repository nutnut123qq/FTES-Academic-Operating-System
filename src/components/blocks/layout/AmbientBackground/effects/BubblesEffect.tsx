import React from "react"
import {
    useSeededParticles,
} from "../useSeededParticles"
import type {
    ParticleEffectProps,
} from "./SnowEffect"

/**
 * Hollow bubbles rising from the bottom edge with a gentle wobble, tinted by the
 * accent colour.
 * @param props - {@link ParticleEffectProps}
 */
export const BubblesEffect = ({ count = 30 }: ParticleEffectProps) => {
    const particles = useSeededParticles(count, 37)
    return (
        <>
            <div
                className="absolute inset-x-0 bottom-0 h-1/3"
                style={{
                    background:
                        "radial-gradient(120% 80% at 50% 120%, color-mix(in oklch, var(--accent) 22%, transparent), transparent 70%)",
                }}
            />
            {particles.map((particle) => (
                <span
                    key={particle.index}
                    className="ambient-bubble absolute bottom-0 rounded-full"
                    style={{
                        left: `${particle.left}%`,
                        width: `${particle.size * 2}px`,
                        height: `${particle.size * 2}px`,
                        border: "1.5px solid color-mix(in oklch, var(--accent) 70%, transparent)",
                        background: "color-mix(in oklch, var(--accent) 12%, transparent)",
                        ["--drift" as string]: `${particle.drift}px`,
                        animation: `bubbleRise ${particle.duration + 3}s ease-in infinite ${particle.delay}s`,
                        opacity: 0,
                    }}
                />
            ))}
        </>
    )
}
