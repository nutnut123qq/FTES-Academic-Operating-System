import React from "react"
import { cn } from "@heroui/react"
import type { WithClassNames } from "@/modules/types/base/class-name"

/** Props for the {@link Logo} block. */
export type LogoProps = WithClassNames<undefined>

/**
 * Logo — the FTES AOS mini mark, theme-aware: the dark lockup
 * (`LogoFtestMini.png`) on light backgrounds, the light one
 * (`ftesMiniDarkMobile.png`) on dark. Both are rendered and toggled with the
 * `dark:` variant (CSS-only, no JS
 * theme read → no hydration flicker). Sizing is controlled by the caller: pass a
 * height (e.g. `h-8`) and let the width follow the intrinsic ratio (`w-auto`).
 *
 * @param props.className - sizing / placement utilities for the image.
 */
export const Logo = ({ className }: LogoProps) => {
    return (
        <>
            {/* eslint-disable @next/next/no-img-element */}
            <img
                src="/logo/LogoFtestMini.png"
                alt="FTES AOS"
                className={cn("h-8 w-auto dark:hidden", className)}
            />
            <img
                src="/logo/ftesMiniDarkMobile.png"
                alt="FTES AOS"
                aria-hidden
                className={cn("hidden h-8 w-auto dark:block", className)}
            />
            {/* eslint-enable @next/next/no-img-element */}
        </>
    )
}
