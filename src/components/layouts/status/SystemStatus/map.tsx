import React from "react"
import type { ReactNode } from "react"
import {
    CheckCircleIcon,
    WarningIcon,
    XCircleIcon,
} from "@phosphor-icons/react"
import type { StatusChipTone } from "@/components/blocks/chips/StatusChip"
import { ComponentStatus } from "@/modules/api/graphql/queries/enums"

/** Visual tokens for one component status (dot color, chip tone, icon). */
export interface ComponentStatusVisual {
    /** Design-token text/background color class for the status dot. */
    dotClassName: string
    /** Semantic tone forwarded to {@link StatusChip}. */
    tone: StatusChipTone
    /** Leading icon for the status chip. */
    icon: ReactNode
}

/**
 * Maps a backend component status (`up` / `degraded` / `down`) to its
 * design-token visual. Uses semantic tokens only so it works in light + dark.
 */
export const COMPONENT_STATUS_VISUAL: Record<string, ComponentStatusVisual> = {
    [ComponentStatus.Up]: {
        dotClassName: "bg-success",
        tone: "success",
        icon: <CheckCircleIcon aria-hidden focusable="false" className="size-4" />,
    },
    [ComponentStatus.Degraded]: {
        dotClassName: "bg-warning",
        tone: "warning",
        icon: <WarningIcon aria-hidden focusable="false" className="size-4" />,
    },
    [ComponentStatus.Down]: {
        dotClassName: "bg-danger",
        tone: "danger",
        icon: <XCircleIcon aria-hidden focusable="false" className="size-4" />,
    },
}

/**
 * Resolves the visual for a status, falling back to the `down` (danger) visual
 * for any unknown value so an unexpected status never renders untinted.
 */
export const resolveComponentStatusVisual = (status: string): ComponentStatusVisual =>
    COMPONENT_STATUS_VISUAL[status] ?? COMPONENT_STATUS_VISUAL[ComponentStatus.Down]
