import React from "react"
import { cn } from "@heroui/react"
import type { WithClassNames } from "@/modules/types/base/class-name"

/** Props for the {@link Logo} block. */
export type LogoProps = WithClassNames<undefined>

/**
 * Logo — the FTES AOS wordmark, rendered from `public/logo/FTES_original.svg`.
 *
 * The asset is a fixed-color gradient lockup (it carries its own brand colors),
 * so it renders identically in light and dark — no `currentColor` / theme handling
 * is needed here. Sizing is controlled by the caller: pass a height (e.g. `h-8`)
 * and let the width follow the intrinsic ratio (`w-auto`, the default).
 *
 * @param props.className - sizing / placement utilities for the image.
 */
export const Logo = ({ className }: LogoProps) => {
    return (
        // eslint-disable-next-line @next/next/no-img-element
        <img
            src="/logo/FTES_original.svg"
            alt="FTES AOS"
            className={cn("h-8 w-auto", className)}
        />
    )
}
