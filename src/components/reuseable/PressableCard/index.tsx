"use client"

import React from "react"
import { cn } from "@heroui/react"
import { motion } from "framer-motion"
import type { WithClassNames } from "@/modules/types/base/class-name"

/** Props for {@link PressableCard}. */
export interface PressableCardProps extends WithClassNames<undefined> {
    /** Card content. */
    children: React.ReactNode
    /** Called when the card is activated (click / Enter / Space). */
    onPress?: () => void
    /** Extra classes merged onto the card surface (visual styling lives here). */
    className?: string
    /** Disables the press animation + interaction and dims the card. */
    disabled?: boolean
    /** Native button type (default `"button"` so it never submits a form). */
    type?: "button" | "submit" | "reset"
    /** Accessible label when the card has no readable text content. */
    ariaLabel?: string
    /** Scale applied while pressed (default `0.96`). */
    pressScale?: number
    /** Scale applied on hover (default `1.02`). */
    hoverScale?: number
}

/**
 * A generic pressable card surface with a Framer Motion press animation.
 *
 * Renders a real `<button>` (so keyboard Enter/Space + focus come for free) and
 * springs down on press / up on hover. It is purely about the interaction +
 * layout — pass visual styling (background, border, radius) via `className`.
 *
 * @example
 * <PressableCard className="card card--default rounded-xl p-3" onPress={open}>
 *   <Thumbnail /> <span>Title</span>
 * </PressableCard>
 *
 * @param props - {@link PressableCardProps}
 */
export const PressableCard = React.forwardRef<HTMLButtonElement, PressableCardProps>(({
    children,
    onPress,
    className,
    disabled = false,
    type = "button",
    ariaLabel,
    pressScale = 0.96,
    hoverScale = 1.02,
}, ref) => {
    return (
        <motion.button
            ref={ref}
            type={type}
            disabled={disabled}
            aria-label={ariaLabel}
            onClick={onPress}
            // spring down on press, lift slightly on hover — skipped while disabled
            whileTap={disabled ? undefined : { scale: pressScale }}
            whileHover={disabled ? undefined : { scale: hoverScale }}
            // snappy spring so the card feels physical, not laggy
            transition={{
                type: "spring",
                stiffness: 400,
                damping: 25,
            }}
            className={cn(
                "text-left outline-none",
                // keep the focus ring keyboard-only so mouse presses stay clean
                "focus-visible:ring-2 focus-visible:ring-foreground/30",
                // dim + lock interaction when disabled
                "disabled:pointer-events-none disabled:opacity-60",
                className,
            )}
        >
            {children}
        </motion.button>
    )
})

PressableCard.displayName = "PressableCard"
