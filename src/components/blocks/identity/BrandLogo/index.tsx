import React from "react"
import { cn } from "@heroui/react"
import type {
    WithClassNames,
} from "@/modules/types/base/class-name"
import { Logo } from "@/components/blocks/identity/Logo"

/** Props for the {@link BrandLogo} block. */
export type BrandLogoProps = WithClassNames<undefined>

/**
 * BrandLogo — the FTES AOS brand lockup. The wordmark ({@link Logo}) already spells
 * out "FTES AOS" over "ACADEMY" with the circuit tracing, so this is now a thin
 * placement wrapper around it (no separate flame mark, no duplicate text label).
 *
 * Kept as the shared identity entry point so callers (navbar, footer, splash)
 * don't need to change. Presentational only — wrap it in a link/button where it
 * needs to act.
 *
 * @param props - optional className (placement / sizing only).
 */
export const BrandLogo = ({ className }: BrandLogoProps) => {
    return <Logo className={cn("h-9 w-auto", className)} />
}
