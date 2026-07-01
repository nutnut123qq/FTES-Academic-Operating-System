import React from "react"
import type { ReactNode } from "react"
import { Button, cn } from "@heroui/react"

import type { WithClassNames } from "@/modules/types/base/class-name"

/**
 * Props for the {@link InputButtonLike} block.
 */
export interface InputButtonLikeProps extends WithClassNames<undefined> {
    /**
     * Placeholder-style label, rendered muted like an empty input value.
     */
    placeholder: ReactNode
    /**
     * Optional leading icon (e.g. a magnifier), rendered muted before the text.
     */
    icon?: ReactNode
    /**
     * Optional trailing content pinned to the right (e.g. a Kbd shortcut hint).
     */
    suffix?: ReactNode
    /**
     * Accessible label for the control. Falls back to {@link placeholder} when it
     * is a plain string.
     */
    ariaLabel?: string
    /**
     * Press handler — opens whatever the field stands in for (e.g. a search overlay).
     */
    onPress: () => void
}

/**
 * A button disguised as an input field ("button trá hình"). It carries the
 * native HeroUI field look — rounded-field shell, field background + border,
 * muted placeholder text — but behaves as a single press target with no inner
 * dividers, so it can trigger an overlay/command palette instead of accepting
 * typed input. Pure and props-only: the block owns the entire look; consumers
 * pass only content + a press handler (and placement via className).
 */
export const InputButtonLike = ({
    placeholder,
    icon,
    suffix,
    ariaLabel,
    onPress,
    className,
}: InputButtonLikeProps) => {
    return (
        <Button
            variant="outline"
            aria-label={ariaLabel ?? (typeof placeholder === "string" ? placeholder : undefined)}
            onPress={onPress}
            className={cn(
                "h-9 min-h-9 w-full justify-between gap-2 rounded-field border-[var(--field-border)] bg-field px-3 font-normal text-field-foreground hover:bg-field",
                className,
            )}
        >
            <span className="inline-flex min-w-0 items-center gap-2">
                {icon}
                <span className="truncate text-sm text-field-placeholder">
                    {placeholder}
                </span>
            </span>
            {suffix ? (
                <span className="inline-flex shrink-0 items-center gap-1.5">
                    {suffix}
                </span>
            ) : null}
        </Button>
    )
}
