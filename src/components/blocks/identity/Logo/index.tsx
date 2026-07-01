import React from "react"
import { cn } from "@heroui/react"
import type { WithClassNames } from "@/modules/types/base/class-name"

/** Props for the {@link Logo} block. */
export type LogoProps = WithClassNames<undefined>

/**
 * Logo — the FTES AOS wordmark, rendered as inline SVG.
 *
 * The mark is already pure text ("FTES AOS" over a wide-tracked "ACADEMY") with the
 * brand-pink circuit tracing woven around the letters, so it carries the whole
 * lockup on its own — no separate text label is needed beside it.
 *
 * Theme-aware by design: the letters use `currentColor` (drive it via a text-*
 * utility, defaults to `text-foreground` so it flips black↔white with the theme)
 * and the circuit uses the accent token. Inline (vs `<img src=".svg">`) so the
 * text resolves to the site's loaded Open Sans face at exact metrics — otherwise
 * the traces, which are positioned around specific glyphs, would drift.
 *
 * Sizing is controlled by the caller: pass a height (e.g. `h-8`) and let the
 * width follow the intrinsic ratio (`w-auto`, the default).
 *
 * @param props.className - sizing / color (text-*) utilities for the root svg.
 */
export const Logo = ({ className }: LogoProps) => {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="16 308 976 383"
            width="976"
            height="383"
            className={cn("h-8 w-auto text-foreground", className)}
            role="img"
            aria-label="FTES AOS"
        >
            {/* wordmark — letters inherit currentColor (theme-aware) */}
            <text
                x="91"
                y="552"
                fontFamily="var(--font-open-sans), 'Open Sans', sans-serif"
                fontWeight="800"
                fontSize="273"
                letterSpacing="-1.8"
                fill="currentColor"
            >
                FTES
            </text>
            <text
                x="102"
                y="680"
                fontFamily="var(--font-open-sans), 'Open Sans', sans-serif"
                fontWeight="700"
                fontSize="46.1"
                letterSpacing="25.33"
                fill="currentColor"
                opacity="0.5"
            >
                AOS
            </text>

            {/* circuit tracing — brand accent */}
            <g
                stroke="var(--accent)"
                strokeWidth="5"
                strokeLinecap="butt"
                strokeLinejoin="miter"
                fill="none"
            >
                <path d="M 272 360 L 296 336 L 346 336" />
                <path d="M 374 336 L 592 336" />
                <path d="M 600 344 L 600 398" />
                <path d="M 608 336 L 648 336 L 672 360 L 736 360 L 752 344" />
                <path d="M 774 336 L 808 336" />
                <path d="M 944 352 L 920 376" />
                <path d="M 960 448 L 904 448 L 904 496" />
                <path d="M 56 424 L 80 424 L 88 432" />
                <path d="M 96 440 L 96 464 L 72 488" />
                <path d="M 96 608 L 40 608 L 40 560" />
                <path d="M 112 608 L 260 608" />
                <path d="M 472 608 L 472 632 L 568 632" />
                <path d="M 512 632 L 512 666" />
                <path d="M 536 632 L 536 666" />
                <path d="M 560 632 L 560 666" />
                <path d="M 568 632 L 632 632 L 656 608 L 720 608 L 744 632 L 848 632 L 872 608 L 904 608" />
            </g>
            <g fill="var(--accent)">
                <circle cx="360" cy="336" r="14" />
                <circle cx="600" cy="408" r="10" />
                <circle cx="760" cy="336" r="14" />
                <circle cx="688" cy="608" r="12" />
                <circle cx="272" cy="608" r="12" />
                <circle cx="96" cy="432" r="8" />
            </g>
            <g fill="none" stroke="var(--accent)" strokeWidth="5">
                <circle cx="264" cy="368" r="8" />
                <circle cx="600" cy="336" r="8" />
                <circle cx="816" cy="336" r="8" />
                <circle cx="952" cy="344" r="8" />
                <circle cx="48" cy="424" r="8" />
                <circle cx="968" cy="448" r="8" />
                <circle cx="104" cy="608" r="8" />
                <circle cx="472" cy="600" r="8" />
                <circle cx="512" cy="672" r="6" />
                <circle cx="536" cy="672" r="6" />
                <circle cx="560" cy="672" r="6" />
            </g>
        </svg>
    )
}
