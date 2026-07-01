import React from "react"
import type { ReactNode } from "react"
import { Chip } from "@heroui/react"

import type { WithClassNames } from "@/modules/types/base/class-name"

/**
 * Semantic tone of the highlight chip — drives the soft tint
 * (`bg-<tone>/10 text-<tone>`). Neutral maps to the default color.
 */
export type HighlightChipTone = "neutral" | "success" | "warning" | "danger" | "accent"

/**
 * Props for the {@link HighlightChip} block.
 */
export interface HighlightChipProps extends WithClassNames<undefined> {
    /**
     * Semantic tone driving the soft-tinted color. Defaults to "neutral".
     */
    tone?: HighlightChipTone
    /**
     * Optional leading icon (typically a Phosphor `*Icon`) before the value.
     */
    icon?: ReactNode
    /**
     * The highlighted value — rendered bold (the chip's focal number/figure).
     */
    value: ReactNode
    /**
     * The supporting label rendered after the value (e.g. "Module", "Giờ học").
     */
    label: ReactNode
}

/**
 * Maps a {@link HighlightChipTone} to the matching HeroUI Chip color
 * (the `soft` variant renders the `bg-<tone>/10 text-<tone>` tint).
 */
const toneToColor: Record<HighlightChipTone, "default" | "success" | "warning" | "danger" | "accent"> = {
    neutral: "default",
    success: "success",
    warning: "warning",
    danger: "danger",
    accent: "accent",
}

/**
 * Stat / meta chip with a highlighted value: a soft-tinted pill rendering an
 * optional leading icon, a bold `value`, then a `label` — e.g. "24 Module",
 * "276 Bài thực hành". Pure and props-only (tone drives the color). Used in the
 * `PageHeader` meta row to show a course's figures.
 */
export const HighlightChip = ({ tone = "neutral", icon, value, label, className }: HighlightChipProps) => {
    return (
        <Chip
            color={toneToColor[tone]}
            variant="soft"
            size="sm"
            className={className}
        >
            {icon}
            <Chip.Label>
                <span className="font-medium">{value}</span> {label}
            </Chip.Label>
        </Chip>
    )
}
