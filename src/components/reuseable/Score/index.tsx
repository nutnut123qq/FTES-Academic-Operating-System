"use client"

import React, { useMemo } from "react"
import { cn } from "@heroui/react"
import { useFormatter, useTranslations } from "next-intl"
import type { WithClassNames } from "@/modules/types/base/class-name"

/**
 * Color of the score based on the ratio compared to the threshold.
 */
type ScoreTone = "danger" | "warning" | "success"

const toneTextClass: Record<ScoreTone, string> = {
    danger: "text-danger",
    warning: "text-warning",
    success: "text-success",
}

const resolveTone = (
    current: number,
    max: number,
    threshold: number,
): ScoreTone => {
    if (max <= 0 || !Number.isFinite(current) || !Number.isFinite(max)) {
        return "danger"
    }
    const ratio = Math.min(Math.max(current / max, 0), 1)
    const half = threshold / 2
    if (ratio < half) {
        return "danger"
    }
    if (ratio < threshold) {
        return "warning"
    }
    return "success"
}

export interface ScoreProps extends WithClassNames<undefined> {
    /** Current score (numerator). */
    current: number
    /** Maximum score (denominator). */
    max: number
    /**
     * Pass ratio for `current / max`.
     * Below `threshold / 2`: danger; from half to below `threshold`: warning; at or above `threshold`: success.
     */
    threshold?: number
    /** Extra classes on the root element (typography, spacing). */
    className?: string
}

/**
 * Renders `current/max` with tone from the ratio against `threshold` (default 0.7).
     * @param props - {@link ScoreProps}
 */
export const Score = (props: ScoreProps) => {
    const {
        current,
        max,
        threshold = 0.7,
        className,
    } = props
    const t = useTranslations()
    const format = useFormatter()

    const tone = useMemo(
        () => resolveTone(current, max, threshold),
        [current, max, threshold],
    )

    const currentLabel = format.number(current, { maximumFractionDigits: 2 })
    const maxLabel = format.number(max, { maximumFractionDigits: 2 })

    const label = useMemo(
        () => t("score.fraction", {
            current: currentLabel,
            max: maxLabel,
        }),
        [t, currentLabel, maxLabel],
    )

    const ariaLabel = useMemo(
        () => t("score.aria", {
            current: currentLabel,
            max: maxLabel,
        }),
        [t, currentLabel, maxLabel],
    )

    return (
        <div
            className={
                cn(
                    "font-medium tabular-nums text-4xl font-bold", 
                    toneTextClass[tone]
                    , className
                )
            }
            aria-label={ariaLabel}
        >
            {label}
        </div>
    )
}
