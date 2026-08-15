import React from "react"

/** Props for one aurora ribbon. */
interface AuroraRibbonProps {
    /** Vertical placement, % of the container height (may be negative). */
    top: number
    /** Seconds for one full sway cycle. */
    duration: number
    /** Animation start delay, seconds — staggers the ribbons. */
    delay: number
}

/**
 * One soft, blurred ribbon swaying slowly, tinted by the accent colour.
 * @param props - {@link AuroraRibbonProps}
 */
const AuroraRibbon = ({
    top,
    duration,
    delay,
}: AuroraRibbonProps) => (
    <div
        className="ambient-aurora absolute inset-x-[-20%]"
        style={{
            top: `${top}%`,
            height: "45%",
            filter: "blur(40px)",
            opacity: 0.35,
            background:
                "linear-gradient(90deg, transparent, color-mix(in oklch, var(--accent) 55%, transparent), transparent)",
            animation: `auroraDrift ${duration}s ease-in-out infinite ${delay}s`,
        }}
    />
)

/** Soft moving aurora ribbons, tinted by the accent colour. */
export const AuroraEffect = () => (
    <>
        <AuroraRibbon top={-10} duration={22} delay={0} />
        <AuroraRibbon top={15} duration={28} delay={4} />
        <AuroraRibbon top={2} duration={18} delay={8} />
    </>
)
