"use client"

import React from "react"
import { ProgressBar, Typography, cn } from "@heroui/react"
import type { ReactNode } from "react"

import type { WithClassNames } from "@/modules/types/base/class-name"

/**
 * Props for the {@link ProgressMeter} block.
 *
 * A presentational, props-only progress meter that renders an optional
 * label / value row above a HeroUI {@link ProgressBar}. It performs no data
 * fetching and reads no global store — all content arrives via props.
 */
export interface ProgressMeterProps extends WithClassNames<undefined> {
    /**
     * Current progress value. Should fall within the range `[0, max]`.
     */
    value: number
    /**
     * Maximum value representing 100% completion. Defaults to `100`.
     */
    max?: number
    /**
     * Optional descriptive label rendered on the left of the top row.
     * Pass a translated string (e.g. `t("...")`) — the block never calls
     * `useTranslations` itself.
     */
    label?: ReactNode
    /**
     * When `true`, renders the rounded completion percentage on the right of
     * the top row. Defaults to `false`.
     */
    showValue?: boolean
    /**
     * Optional accessible label for the progress bar.
     * If omitted, the label prop is used when it is a string; otherwise
     * the underlying HeroUI ProgressBar falls back to its default label.
     */
    "aria-label"?: string
}

/**
 * ProgressMeter renders a labelled, accessible progress bar.
 *
 * Layout:
 * - An optional top row (only shown when {@link ProgressMeterProps.label} or
 *   {@link ProgressMeterProps.showValue} is provided) with the label on the
 *   left and the rounded percentage on the right.
 * - The HeroUI {@link ProgressBar} sized small with the accent color.
 *
 * @param props - See {@link ProgressMeterProps}.
 * @returns The rendered progress meter.
 */
export const ProgressMeter = ({
    value,
    max = 100,
    label,
    showValue = false,
    className,
    "aria-label": ariaLabel,
}: ProgressMeterProps) => {
    const safeMax = max > 0 ? max : 1
    const percent = Math.round((value / safeMax) * 100)
    const hasTopRow = label !== undefined || showValue

    return (
        <div className={cn("flex flex-col gap-2", className)}>
            {hasTopRow ? (
                <div className="flex items-center justify-between gap-2">
                    <Typography type="body-xs" color="muted" className="min-w-0 truncate">{label}</Typography>
                    {showValue ? (
                        <Typography type="body-xs" color="muted" className="shrink-0">{percent}%</Typography>
                    ) : null}
                </div>
            ) : null}
            <ProgressBar
                aria-label={ariaLabel ?? (typeof label === "string" ? label : "Progress")}
                value={value}
                maxValue={safeMax}
                color="accent"
                size="sm"
            >
                <ProgressBar.Track>
                    <ProgressBar.Fill />
                </ProgressBar.Track>
            </ProgressBar>
        </div>
    )
}
