import React from "react"
import { Chip, cn } from "@heroui/react"
import type { ReactNode } from "react"
import type { WithClassNames } from "@/modules/types/base/class-name"

/** The supported difficulty levels a piece of content can be tagged with. */
export type Difficulty = "beginner" | "intermediate" | "advanced" | "insane"

/**
 * Maps each difficulty level to the semantic HeroUI Chip color that conveys its
 * relative intensity (easy → success, hardest → accent).
 */
const DIFFICULTY_COLOR: Record<Difficulty, "success" | "warning" | "danger" | "accent"> = {
    beginner: "success",
    intermediate: "warning",
    advanced: "danger",
    insane: "accent",
}

/** Props for {@link DifficultyChip}. */
export interface DifficultyChipProps extends WithClassNames<undefined> {
    /** Difficulty level to display. Drives the chip color via {@link DIFFICULTY_COLOR}. */
    difficulty: Difficulty
    /** Optional label override; defaults to the capitalized difficulty word. */
    label?: ReactNode
}

/**
 * Presentational difficulty badge — a small pill-shaped HeroUI Chip whose colour
 * encodes the difficulty intensity. Pure props-only block.
 *
 * @param props - {@link DifficultyChipProps}
 */
export const DifficultyChip = ({
    difficulty,
    label,
    className,
}: DifficultyChipProps) => {
    const capitalized = difficulty.charAt(0).toUpperCase() + difficulty.slice(1)
    return (
        <Chip
            color={DIFFICULTY_COLOR[difficulty]}
            size="sm"
            variant="soft"
            className={cn("w-fit", className)}
        >
            <Chip.Label>{label ?? capitalized}</Chip.Label>
        </Chip>
    )
}
