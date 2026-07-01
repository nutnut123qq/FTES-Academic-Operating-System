import React from "react"
import type { ReactNode } from "react"
import { Button, Typography, cn } from "@heroui/react"
import { WarningOctagonIcon } from "@phosphor-icons/react"

import type { WithClassNames } from "@/modules/types/base/class-name"

/**
 * Props for the {@link ErrorContent} block.
 */
export interface ErrorContentProps extends WithClassNames<undefined> {
    /** Primary error line. */
    title: ReactNode
    /** Optional supporting line below the title (cause / what to do). */
    description?: ReactNode
    /** Override the default warning-octagon icon. */
    icon?: ReactNode
    /** Retry handler — renders a button when paired with a label. */
    onRetry?: () => void
    /** Translated label for the retry button (required to render it). */
    retryLabel?: ReactNode
}

/**
 * Standalone error state — a danger {@link WarningOctagonIcon}, a title + optional
 * description, and a "try again" button, centered. The standard `errorContent`
 * for {@link import("../AsyncContent").AsyncContent}. Pure/props-only; the block
 * owns its look, text arrives translated from the caller.
 */
export const ErrorContent = ({
    title,
    description,
    icon,
    onRetry,
    retryLabel,
    className,
}: ErrorContentProps) => {
    return (
        <div className={cn("flex flex-col items-center gap-3 px-6 py-6 text-center", className)}>
            {icon ?? (
                <WarningOctagonIcon
                    aria-hidden
                    focusable="false"
                    className="size-8 text-danger"
                />
            )}
            <div className="flex flex-col gap-2">
                <Typography type="body-sm" weight="medium" align="center">
                    {title}
                </Typography>
                {description ? (
                    <Typography type="body-xs" color="muted" align="center">
                        {description}
                    </Typography>
                ) : null}
            </div>
            {onRetry && retryLabel ? (
                <Button variant="secondary" size="sm" onPress={onRetry}>
                    {retryLabel}
                </Button>
            ) : null}
        </div>
    )
}
