import React from "react"
import type { ReactNode } from "react"
import { Button, Typography, cn } from "@heroui/react"
import { TrayIcon } from "@phosphor-icons/react"

import type { WithClassNames } from "@/modules/types/base/class-name"

/**
 * Props for the {@link EmptyContent} block.
 */
export interface EmptyContentProps extends WithClassNames<undefined> {
    /** Primary "nothing here" line. */
    title: ReactNode
    /** Optional supporting line below the title. */
    description?: ReactNode
    /** Override the default tray icon. */
    icon?: ReactNode
    /** Optional retry/refresh handler — renders a button when paired with a label. */
    onRetry?: () => void
    /** Translated label for the retry button (required to render it). */
    retryLabel?: ReactNode
    /** Optional custom action rendered below the description (e.g. a primary CTA). */
    action?: ReactNode
}

/**
 * Standalone empty state — a {@link TrayIcon}, a title + optional description, and
 * an optional "try again" button, centered. The standard `emptyContent` for
 * {@link import("../AsyncContent").AsyncContent}. Pure/props-only; the block owns
 * its look, text arrives translated from the caller.
 */
export const EmptyContent = ({
    title,
    description,
    icon,
    onRetry,
    retryLabel,
    action,
    className,
}: EmptyContentProps) => {
    return (
        <div className={cn("flex w-full flex-col items-center justify-center gap-3 px-6 py-6 text-center", className)}>
            {icon ?? <TrayIcon aria-hidden focusable="false" className="size-8 text-muted" />}
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
            {action ? action : null}
        </div>
    )
}
