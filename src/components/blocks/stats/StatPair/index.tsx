import React from "react"
import {
    cn,
    Typography,
} from "@heroui/react"
import type {
    WithClassNames,
} from "@/modules/types/base/class-name"

/** Props for {@link StatPair}. */
export interface StatPairProps extends WithClassNames<undefined> {
    /**
     * The headline statistic — typically a number or short formatted count
     * (e.g. "1,204" or "12"). Rendered large and emphasized.
     */
    value: React.ReactNode
    /**
     * The caption describing what the value measures (e.g. "Followers").
     * Rendered small and muted beneath the value.
     */
    label: React.ReactNode
    /**
     * Horizontal alignment of the stacked value + label.
     * - "start": left-aligned (default).
     * - "center": centered.
     */
    align?: "start" | "center"
    /**
     * Visual size of the headline value.
     * - "md": `h4` (default — stat strips / ribbons).
     * - "lg": `h2` (a prominent hero count).
     */
    size?: "md" | "lg"
}

/**
 * A single count + label statistic, stacked vertically. Presentational only:
 * it takes its content via props and is meant to sit inside a stat strip /
 * StatRibbon alongside sibling pairs. No frame of its own — the surrounding
 * ribbon supplies the card and dividers.
 *
 * @param props - {@link StatPairProps}
 */
export const StatPair = ({
    value,
    label,
    align = "start",
    size = "md",
    className,
}: StatPairProps) => {
    return (
        <div
            className={cn(
                "flex flex-col gap-0",
                align === "center" ? "items-center" : "items-start",
                className,
            )}
        >
            <Typography type={size === "lg" ? "h2" : "h4"} weight="semibold">{value}</Typography>
            <Typography type="body-xs" color="muted">{label}</Typography>
        </div>
    )
}
