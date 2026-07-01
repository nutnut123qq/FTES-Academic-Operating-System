import React from "react"
import type { ReactNode } from "react"
import { Chip } from "@heroui/react"

import type { WithClassNames } from "@/modules/types/base/class-name"

/**
 * Semantic tone of the status chip. Each tone maps to a HeroUI Chip color
 * (the neutral tone maps to the default color).
 */
export type StatusChipTone = "neutral" | "success" | "warning" | "danger" | "accent"

/**
 * Props for the {@link StatusChip} block.
 */
export interface StatusChipProps extends WithClassNames<undefined> {
    /**
     * Semantic tone that drives the chip color. Defaults to "neutral".
     */
    tone?: StatusChipTone
    /**
     * Optional leading icon (typically a Phosphor icon) rendered before the label.
     */
    icon?: ReactNode
    /**
     * Label content rendered inside the chip.
     */
    children: ReactNode
}

/**
 * Maps a {@link StatusChipTone} to the matching HeroUI Chip color.
 */
const toneToColor: Record<StatusChipTone, "default" | "success" | "warning" | "danger" | "accent"> = {
    neutral: "default",
    success: "success",
    warning: "warning",
    danger: "danger",
    accent: "accent",
}

/**
 * Generic, presentational status chip. A thin pill-shaped wrapper over the
 * HeroUI Chip that maps a semantic tone to a chip color and optionally renders
 * a leading icon before the label. Pure and props-only: it holds no store,
 * data fetching, or callbacks of its own.
 */
export const StatusChip = ({ tone = "neutral", icon, children, className }: StatusChipProps) => {
    return (
        <Chip
            color={toneToColor[tone]}
            variant="soft"
            size="sm"
            className={className}
        >
            {icon}
            <Chip.Label>{children}</Chip.Label>
        </Chip>
    )
}
