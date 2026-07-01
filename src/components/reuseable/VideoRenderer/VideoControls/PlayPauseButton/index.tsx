"use client"

import { Pause as PauseIcon, Play as PlayIcon } from "@gravity-ui/icons"
import React from "react"
import { Button, cn } from "@heroui/react"
import type { WithClassNames } from "@/modules/types/base/class-name"

/** Props for {@link PlayPauseButton}. */
export interface PlayPauseButtonProps extends WithClassNames<undefined> {
    /** Whether playback is currently active (renders the pause icon). */
    isPlaying: boolean
    /** Fired when the user toggles play/pause. */
    onPlayPause: () => void
}

/**
 * Icon button that toggles between play and pause.
 *
 * Presentational: derives only its icon from `isPlaying`, no logic.
 * @param props - Playing state and the toggle callback.
 */
export const PlayPauseButton = ({
    isPlaying,
    onPlayPause,
    className,
}: PlayPauseButtonProps) => {
    return (
        <Button
            isIconOnly
            variant="ghost"
            aria-label={isPlaying ? "Pause" : "Play"}
            onPress={onPlayPause}
            className={cn("text-white hover:bg-white/20 border-none min-w-8 h-8", className)}
        >
            {isPlaying ? (
                <PauseIcon className="h-5 w-5" />
            ) : (
                <PlayIcon className="h-5 w-5" />
            )}
        </Button>
    )
}
