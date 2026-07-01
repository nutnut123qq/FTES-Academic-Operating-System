"use client"

import React from "react"
import {
    Button,
    Typography,
    cn,
} from "@heroui/react"
import { TriangleExclamation } from "@gravity-ui/icons"
import type {
    WithClassNames,
} from "@/modules/types/base/class-name"

/** Props for {@link ErrorState}. */
export interface ErrorStateProps extends WithClassNames<undefined> {
    /**
     * Primary error headline rendered emphasized below the warning icon.
     * Caller supplies a translated node (e.g. via `t()`).
     */
    title?: React.ReactNode
    /**
     * Secondary explanatory line shown muted beneath the title.
     * Caller supplies a translated node (e.g. via `t()`).
     */
    description?: React.ReactNode
    /**
     * Label for the retry button. The button only renders when both this
     * label and {@link onRetry} are provided. Caller supplies a translated node.
     */
    retryLabel?: React.ReactNode
    /**
     * Invoked when the user presses the retry button. When omitted, no retry
     * button is shown regardless of {@link retryLabel}.
     */
    onRetry?: () => void
}

/**
 * Centered, presentational error-state block: a danger-toned warning icon, an
 * optional title and description, and an optional retry button. Purely
 * props-driven (no store/fetch); text and the retry handler are supplied by the
 * caller so it stays self-contained and reusable across features.
 *
 * @param props - {@link ErrorStateProps}
 */
export const ErrorState = ({
    title,
    description,
    retryLabel,
    onRetry,
    className,
}: ErrorStateProps) => {
    return (
        <div
            className={cn(
                "flex flex-col items-center gap-3 py-6 text-center",
                className,
            )}
        >
            <TriangleExclamation className="size-8 text-danger" />
            {title ? (
                <Typography weight="medium">{title}</Typography>
            ) : null}
            {description ? (
                <Typography type="body-xs" color="muted">{description}</Typography>
            ) : null}
            {onRetry && retryLabel ? (
                <Button variant="secondary" size="sm" onPress={onRetry}>
                    {retryLabel}
                </Button>
            ) : null}
        </div>
    )
}
