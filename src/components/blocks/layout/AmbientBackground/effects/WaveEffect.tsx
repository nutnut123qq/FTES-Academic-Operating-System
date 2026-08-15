import React from "react"

/** Props for one wave layer. */
interface WaveLayerProps {
    /** Seconds for one full tile scroll (lower = faster; drives the parallax). */
    duration: number
    /** Layer opacity. */
    opacity: number
    /** Offset from the viewport bottom, px. */
    bottom: number
    /** Crest height of the drawn path. */
    amplitude: number
}

/**
 * One tiled, horizontally-scrolling wave layer (two copies side by side loop
 * seamlessly via the `waveDrift` keyframe).
 * @param props - {@link WaveLayerProps}
 */
const WaveLayer = ({
    duration,
    opacity,
    bottom,
    amplitude,
}: WaveLayerProps) => (
    <div
        className="ambient-wave absolute left-0 w-[200%]"
        style={{
            bottom: `${bottom}px`,
            height: "56px",
            opacity,
            animation: `waveDrift ${duration}s linear infinite`,
        }}
    >
        <svg viewBox="0 0 240 40" preserveAspectRatio="none" className="block h-full w-full">
            <path
                d={`M0,${20 - amplitude} c15,${amplitude * -1.4} 45,${amplitude * -1.4} 60,0 c15,${amplitude * 1.4} 45,${amplitude * 1.4} 60,0 c15,${amplitude * -1.4} 45,${amplitude * -1.4} 60,0 c15,${amplitude * 1.4} 45,${amplitude * 1.4} 60,0 L240,40 L0,40 Z`}
                fill="var(--accent)"
            />
        </svg>
    </div>
)

/** Layered waves drifting horizontally at the bottom edge, tinted by the accent colour. */
export const WaveEffect = () => (
    <>
        <div
            className="absolute inset-x-0 bottom-0 h-1/2"
            style={{
                background:
                    "radial-gradient(120% 80% at 50% 120%, color-mix(in oklch, var(--accent) 28%, transparent), transparent 70%)",
            }}
        />
        <WaveLayer duration={9} opacity={0.35} bottom={0} amplitude={10} />
        <WaveLayer duration={6.5} opacity={0.5} bottom={6} amplitude={8} />
    </>
)
