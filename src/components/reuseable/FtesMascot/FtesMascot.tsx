"use client"

import React from "react"
import { cn } from "@heroui/react"
import { useTranslations } from "next-intl"
import type { WithClassNames } from "@/modules/types/base/class-name"
import { MASCOT_ART, type MascotPose } from "./art"

/** Box width per size (height follows the 100:120 art aspect ratio). */
const SIZE_PX: Record<NonNullable<FtesMascotProps["size"]>, number> = {
    sm: 48,
    md: 72,
    lg: 112,
}

/** Art aspect ratio (viewBox is `0 0 100 120`). */
const ASPECT = 120 / 100

/** Props for {@link FtesMascot}. */
export interface FtesMascotProps extends WithClassNames<undefined> {
    /** Which of the four poses to show. */
    pose: MascotPose
    /** Rendered box size. Defaults to `"md"`. */
    size?: "sm" | "md" | "lg"
    /**
     * Idle bob animation. On by default; it is ALWAYS suppressed under
     * `prefers-reduced-motion` via the `.mascot-bob` rule in `globals.css`, so
     * callers never have to branch on the user's motion setting.
     */
    animated?: boolean
    /**
     * The mascot is decorative by default (`aria-hidden`) — meaning lives in the
     * speech bubble ({@link MascotBubble}), not the drawing. Set `false` when the
     * mascot stands alone and needs an accessible name (`mascot.name`).
     */
    decorative?: boolean
}

/**
 * The FTES mascot — a husky in glasses and an FTES polo — rendered in one of
 * four poses at three sizes, with a gentle idle bob that respects
 * `prefers-reduced-motion`.
 *
 * The artwork is a swappable placeholder that lives entirely in
 * {@link MASCOT_ART} (`./art`); this component only sizes the box, toggles the
 * bob, and wires accessibility. See `openspec/changes/onboarding-mascot-guide`.
 *
 * @param props - {@link FtesMascotProps}
 */
export const FtesMascot = ({
    pose,
    size = "md",
    animated = true,
    decorative = true,
    className,
}: FtesMascotProps) => {
    const t = useTranslations()
    const width = SIZE_PX[size]

    return (
        <span
            role={decorative ? undefined : "img"}
            aria-hidden={decorative ? true : undefined}
            aria-label={decorative ? undefined : t("mascot.name")}
            data-pose={pose}
            className={cn(
                "inline-flex shrink-0 select-none items-center justify-center",
                animated && "mascot-bob",
                className,
            )}
            style={{
                width,
                height: Math.round(width * ASPECT),
            }}
        >
            {MASCOT_ART[pose]}
        </span>
    )
}
