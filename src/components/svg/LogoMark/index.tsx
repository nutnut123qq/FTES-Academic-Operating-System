import React from "react"
import { cn } from "@heroui/react"
import type { WithClassNames } from "@/modules/types/base/class-name"

/** Props for {@link LogoMark}. */
export type LogoMarkProps = WithClassNames<undefined>

/**
 * LogoMark — the square "S✦" brand mark, rendered as inline SVG.
 *
 * Inline (vs `<img src=".svg">`) so it stays crisp at any size and the "S"
 * resolves to the site's Open Sans face instead of an SVG-renderer fallback.
 *
 * @param props.className - sizing/utility classes for the root svg
 */
export const LogoMark = ({ className }: LogoMarkProps) => {
    return (
        <svg
            className={cn(className)}
            viewBox="0 0 512 512"
            width="512"
            height="512"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            role="img"
            aria-label="FTES AOS"
        >
            <defs>
                <linearGradient id="logoMarkTeal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#22E8D3" />
                    <stop offset="50%" stopColor="#00BBA9" />
                    <stop offset="100%" stopColor="#008A7F" />
                </linearGradient>
                <radialGradient id="logoMarkGlow" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#5BF0E0" stopOpacity="0.55" />
                    <stop offset="100%" stopColor="#5BF0E0" stopOpacity="0" />
                </radialGradient>
            </defs>

            {/* Rounded dark tile */}
            <rect x="16" y="16" width="480" height="480" rx="116" fill="#0C1413" />
            <rect x="16" y="16" width="480" height="480" rx="116" fill="none" stroke="#16302C" strokeWidth="3" />

            {/* S monogram */}
            <text
                x="256"
                y="400"
                fontFamily="var(--font-open-sans), 'Open Sans', 'Segoe UI', system-ui, Arial, sans-serif"
                fontSize="400"
                fontWeight="800"
                textAnchor="middle"
                fill="url(#logoMarkTeal)"
            >
                S
            </text>

            {/* Sparkle accent */}
            <circle cx="372" cy="150" r="60" fill="url(#logoMarkGlow)" />
            <path d="M372 102 Q372 150 420 150 Q372 150 372 198 Q372 150 324 150 Q372 150 372 102 Z" fill="#22E8D3" />
        </svg>
    )
}
