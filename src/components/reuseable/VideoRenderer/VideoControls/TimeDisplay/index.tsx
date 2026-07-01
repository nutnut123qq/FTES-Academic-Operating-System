"use client"

import React, { useMemo } from "react"
import { cn } from "@heroui/react"
import { formatTime } from "../utils"
import type { WithClassNames } from "@/modules/types/base/class-name"

/** Props for {@link TimeDisplay}. */
export interface TimeDisplayProps extends WithClassNames<undefined> {
    /** Current playback position in seconds. */
    currentTime: number
    /** Total media duration in seconds. */
    duration: number
}

/**
 * Monospace `current / total` time readout.
 *
 * Presentational: derives formatted strings only.
 * @param props - Current time and duration in seconds.
 */
export const TimeDisplay = ({
    currentTime,
    duration,
    className,
}: TimeDisplayProps) => {
    /** Formatted current playback position. */
    const current = useMemo(
        () => formatTime(currentTime),
        [
            currentTime,
        ],
    )

    /** Formatted total duration. */
    const total = useMemo(
        () => formatTime(duration),
        [
            duration,
        ],
    )

    return (
        <span className={cn("select-none text-xs font-mono text-white/80", className)}>
            {current}{" "}
            <span className="text-white/40">/</span>{" "}
            {total}
        </span>
    )
}
