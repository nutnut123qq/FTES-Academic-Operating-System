import React from "react"

/** A pulsing circuit-board grid overlay, tinted by the accent colour. */
export const CircuitEffect = () => (
    <div
        className="ambient-circuit absolute inset-0"
        style={{
            opacity: 0.5,
            backgroundImage:
                "linear-gradient(color-mix(in oklch, var(--accent) 35%, transparent) 1px, transparent 1px), linear-gradient(90deg, color-mix(in oklch, var(--accent) 35%, transparent) 1px, transparent 1px)",
            backgroundSize: "56px 56px",
            animation: "circuitPulse 5s ease-in-out infinite",
            maskImage: "radial-gradient(120% 90% at 50% 100%, black, transparent 85%)",
        }}
    />
)
