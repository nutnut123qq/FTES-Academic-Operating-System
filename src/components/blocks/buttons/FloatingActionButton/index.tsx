"use client"

import React from "react"
import { Button, cn } from "@heroui/react"
import type { ReactNode } from "react"
import type { WithClassNames } from "@/modules/types/base/class-name"

/** Props for the {@link FloatingActionButton} block. */
export interface FloatingActionButtonProps extends WithClassNames<undefined> {
    /** Press handler (open the target overlay / action). */
    onPress: () => void
    /** Accessible name for the icon-only button. */
    ariaLabel: string
    /**
     * Icon content, centered and sized by the icon-only button (HeroUI sizes the
     * child svg to `size-5`, or `size-4` on ≥sm) — pass a bare icon, no size class.
     */
    children?: ReactNode
}

/**
 * A bottom-right floating action button — a round, shadowed accent circle wrapping
 * a HeroUI `<Button isIconOnly>` (so the `children` icon inherits the button's
 * native svg sizing). Pure + props-only; owns its look + fixed placement.
 *
 * @param props - {@link FloatingActionButtonProps}
 */
export const FloatingActionButton = ({
    onPress,
    ariaLabel,
    children,
    className,
}: FloatingActionButtonProps) => {
    return (
        <Button
            isIconOnly
            variant="primary"
            aria-label={ariaLabel}
            onPress={onPress}
            className={cn(
                "fixed bottom-6 right-6 z-40 rounded-full shadow-lg",
                className,
            )}
        >
            {children}
        </Button>
    )
}
