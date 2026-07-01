"use client"

import React from "react"
import { Alert, CloseButton, cn } from "@heroui/react"

/** Semantic tone — maps 1:1 to HeroUI `Alert` `status`. */
export type CalloutStatus = "default" | "accent" | "success" | "warning" | "danger"

/** Soft tint per status — a callout nested inside a card uses `bg-<status>/10` (not
 * the default `bg-surface`) so it reads as a thin highlight strip, not a card-in-card. */
const STATUS_TINT: Record<CalloutStatus, string> = {
    default: "bg-default",
    accent: "bg-accent/10",
    success: "bg-success/10",
    warning: "bg-warning/10",
    danger: "bg-danger/10",
}

/** Close button colour follows the status (matches the tint). */
const STATUS_CLOSE: Record<CalloutStatus, string> = {
    default: "text-muted hover:bg-default",
    accent: "text-accent hover:bg-accent/10",
    success: "text-success hover:bg-success/10",
    warning: "text-warning hover:bg-warning/10",
    danger: "text-danger hover:bg-danger/10",
}

/** Props for {@link Callout}. */
export interface CalloutProps {
    /** Semantic tone (drives tint + icon/title colour). Default `"default"`. */
    status?: CalloutStatus
    /** Headline line (always shown). */
    title: React.ReactNode
    /** Optional supporting line under the title. */
    description?: React.ReactNode
    /** Optional custom indicator icon (Phosphor `*Icon` / `Spinner`); omit for the
     * default status icon. The icon inherits the status colour — don't colour it. */
    icon?: React.ReactNode
    /** Optional trailing action (e.g. a `<Button>`), rendered before the close button. */
    action?: React.ReactNode
    /** When provided, renders a HeroUI `CloseButton` (×) wired to this. */
    onClose?: () => void
    /** Accessible label for the close button. */
    closeAriaLabel?: string
    /** Placement utilities only (e.g. `mb-4`) — NOT for restyling the callout. */
    className?: string
}

/**
 * A tinted, flat note for use **inside a card / surface** (surface-in-surface):
 * a thin `bg-<status>/10` + `shadow-none` highlight strip, so it doesn't read as
 * a card-in-card (the default HeroUI `Alert` `bg-surface` + shadow would). Wraps
 * HeroUI `Alert` + `CloseButton` so features just pass content — the block owns
 * the tint/flat treatment and the status-coloured close button. For a standalone
 * alert on the page canvas, use the raw `Alert` (its default surface look is
 * correct there). See `elements/alert.md`.
 */
export const Callout = ({
    status = "default",
    title,
    description,
    icon,
    action,
    onClose,
    closeAriaLabel,
    className,
}: CalloutProps) => {
    return (
        <Alert status={status} className={cn("shadow-none", STATUS_TINT[status], className)}>
            {icon ? <Alert.Indicator>{icon}</Alert.Indicator> : <Alert.Indicator />}
            <Alert.Content>
                <Alert.Title>{title}</Alert.Title>
                {description ? (
                    <Alert.Description>{description}</Alert.Description>
                ) : null}
            </Alert.Content>
            {action}
            {onClose ? (
                <CloseButton
                    aria-label={closeAriaLabel}
                    onPress={onClose}
                    className={STATUS_CLOSE[status]}
                />
            ) : null}
        </Alert>
    )
}
