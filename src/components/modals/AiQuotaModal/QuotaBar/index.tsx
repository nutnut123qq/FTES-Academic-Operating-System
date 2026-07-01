"use client"

import React, {
    useMemo,
} from "react"
import {
    cn,
    ProgressBar,
} from "@heroui/react"
import {
    resolveQuotaBarFillTone,
} from "../utils"
import type { WithClassNames } from "@/modules/types/base/class-name"

/** Props for {@link QuotaBar}. */
export interface QuotaBarProps extends WithClassNames<undefined> {
    /** Window label (e.g. "Next 5 hours"). */
    label: string
    /** Amount consumed in the window. */
    used: number
    /** Cap for the window (0 means "no allowance"). */
    limit: number
    /** Unit suffix when {@link QuotaBarProps.showUnit} is true. */
    unit?: string
    /** When true, append {@link QuotaBarProps.unit} after the counts. */
    showUnit?: boolean
    /** Optional reset time shown under the bar (e.g. "Reset lúc 18:50 01/06"). */
    resetLabel?: string | null
}

/**
 * Labelled quota usage bar (HeroUI {@link ProgressBar}) with 3 color tiers:
 * accent ≤75%, warning >75%, danger >90% consumed.
 * @param props - label, used/limit counts, optional unit and reset copy
 */
export const QuotaBar = ({
    label,
    used,
    limit,
    unit = "",
    showUnit = false,
    resetLabel,
    className,
}: QuotaBarProps) => {
    const fillTone = useMemo(
        () => resolveQuotaBarFillTone(used, limit),
        [
            used,
            limit,
        ],
    )
    const value = useMemo(() => {
        if (limit <= 0) {
            return used > 0 ? 100 : 0
        }
        return Math.min(100, Math.max(0, (used / limit) * 100))
    }, [
        used,
        limit,
    ])

    return (
        <div className={cn("flex flex-col gap-1.5", className)}>
            <div className="flex items-center justify-between gap-1.5 text-sm">
                <span className="text-muted">{label}</span>
                <span className="font-medium text-foreground">
                    {used}
                    {" / "}
                    {limit}
                    {showUnit && unit ? (
                        <>
                            {" "}
                            <span className="text-muted">{unit}</span>
                        </>
                    ) : null}
                </span>
            </div>

            <ProgressBar
                aria-label={label}
                className="w-full"
                color={fillTone}
                maxValue={100}
                minValue={0}
                size="sm"
                value={value}
            >
                <ProgressBar.Track>
                    <ProgressBar.Fill />
                </ProgressBar.Track>
            </ProgressBar>
            {resetLabel ? (
                <div className="text-xs text-muted">{resetLabel}</div>
            ) : null}
        </div>
    )
}
