"use client"

import React from "react"
import { cn, Slider } from "@heroui/react"
import { useCallback } from "react"
import type { WithClassNames } from "@/modules/types/base/class-name"

/** Props for {@link SeekBar}. */
export interface SeekBarProps extends WithClassNames<undefined> {
    /** Current playback position in seconds. */
    currentTime: number
    /** Total media duration in seconds. */
    duration: number
    /** Fired with the requested seek position in seconds. */
    onSeek: (time: number) => void
}

/**
 * Horizontal scrubber for seeking within the media timeline.
 *
 * Presentational: forwards slider changes to {@link SeekBarProps.onSeek}.
 * @param props - Current time, duration, and the seek callback.
 */
export const SeekBar = ({
    currentTime,
    duration,
    onSeek,
    className,
}: SeekBarProps) => {
    /** Normalize the slider value to a number before bubbling the seek. */
    const onChange = useCallback(
        (value: number | Array<number>) => onSeek(value as number),
        [
            onSeek,
        ],
    )

    return (
        <Slider
            aria-label="Seek"
            step={0.1}
            minValue={0}
            maxValue={duration || 1}
            value={currentTime}
            onChange={onChange}
            className={cn("mb-2", className)}
        />
    )
}
