"use client"

import React from "react"
import { cn } from "@heroui/react"
import { FtesMascot } from "./FtesMascot"
import type { MascotPose } from "./art"

/** Props for {@link MascotBubble}. */
export interface MascotBubbleProps {
    /** Pose for the mascot beside the bubble. */
    pose: MascotPose
    /** Mascot box size. Defaults to `"md"`. */
    size?: "sm" | "md" | "lg"
    /** Optional bold lead line above the body copy. */
    title?: React.ReactNode
    /** Body copy — the meaningful message spoken by the mascot. */
    children: React.ReactNode
    /** Optional action row (buttons / links) under the copy. */
    actions?: React.ReactNode
    /**
     * Announce the copy to assistive tech via `aria-live="polite"`. On by default
     * so tour/nudge messages are read as they appear; turn OFF for purely static
     * decorative bubbles that never change.
     */
    announce?: boolean
    /** Forward the mascot idle bob toggle (defaults to on / reduced-motion-safe). */
    animated?: boolean
    /** Class on the outer wrapper. */
    className?: string
}

/**
 * A reusable mascot speech bubble: {@link FtesMascot} next to a bordered card
 * holding a title, body copy and an optional action row, with a small pointer
 * aimed back at the mascot. This is the shared surface for every mascot moment —
 * onboarding coach-marks, context tips, celebrations and the helper panel — so
 * copy styling and a11y stay consistent everywhere.
 *
 * The mascot is decorative; the copy carries the meaning and is placed in an
 * `aria-live` region (see `announce`). See
 * `openspec/changes/onboarding-mascot-guide`.
 *
 * @param props - {@link MascotBubbleProps}
 */
export const MascotBubble = ({
    pose,
    size = "lg",
    title,
    children,
    actions,
    announce = true,
    animated = true,
    className,
}: MascotBubbleProps) => (
    <div className={cn("flex items-start gap-4", className)}>
        <FtesMascot pose={pose} size={size} animated={animated} />
        <div className="relative min-w-0 flex-1 rounded-3xl border border-default bg-surface px-6 py-5 shadow-lg ring-1 ring-accent/10">
            {/* pointer aimed at the mascot */}
            <span
                aria-hidden="true"
                className="absolute -left-2 top-8 size-4 rotate-45 border-b border-l border-default bg-surface"
            />
            <div
                aria-live={announce ? "polite" : undefined}
                className="relative flex flex-col gap-2"
            >
                {title ? (
                    <p className="text-lg font-bold text-foreground">{title}</p>
                ) : null}
                <div className="text-base leading-relaxed text-foreground/85">{children}</div>
            </div>
            {actions ? (
                <div className="relative mt-4 flex flex-wrap items-center gap-2">{actions}</div>
            ) : null}
        </div>
    </div>
)
