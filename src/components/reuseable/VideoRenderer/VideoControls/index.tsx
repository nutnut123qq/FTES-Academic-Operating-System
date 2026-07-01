"use client"

import React from "react"
import { cn } from "@heroui/react"
import { useMemo } from "react"
import { FullscreenButton } from "./FullscreenButton"
import { PlayPauseButton } from "./PlayPauseButton"
import { QualitySelector } from "./QualitySelector"
import { SeekBar } from "./SeekBar"
import { TimeDisplay } from "./TimeDisplay"
import type { QualityLevel } from "./types"
import { VolumeControl } from "./VolumeControl"
import type { WithClassNames } from "@/modules/types/base/class-name"

export type { QualityLevel } from "./types"

/** Props for {@link VideoControls}. */
export interface VideoControlsProps extends WithClassNames<undefined> {
    /** Whether playback is currently active. */
    isPlaying: boolean
    /** Current playback position in seconds. */
    currentTime: number
    /** Total media duration in seconds. */
    duration: number
    /** Current volume in the `0..1` range. */
    volume: number
    /** Whether audio is currently muted. */
    isMuted: boolean
    /** Fired when the user toggles play/pause. */
    onPlayPause: () => void
    /** Fired with the requested seek position in seconds. */
    onSeek: (time: number) => void
    /** Fired with the requested volume in the `0..1` range. */
    onVolumeChange: (vol: number) => void
    /** Fired when the user toggles mute. */
    onMuteToggle: () => void
    /** Fired when the user requests fullscreen toggle. */
    onFullscreen?: () => void
    /** DASH-only: available quality levels. */
    qualityLevels?: Array<QualityLevel>
    /** DASH-only: currently selected quality index (`-1` = auto). */
    selectedQuality?: number
    /** DASH-only: callback to change quality. */
    onQualityChange?: (index: number) => void
    /** Whether to hide the control bar. */
    hidden?: boolean
}

/**
 * Shared video control bar overlay.
 *
 * Used by the Standard and MpegDash players. Composes play/pause, seek slider,
 * volume, time display, optional quality selector (DASH), and fullscreen into a
 * single bottom-anchored overlay. Presentational: derives visibility classes and
 * quality availability, no playback logic.
 * @param props - Playback state plus the control callbacks.
 */
export const VideoControls = ({
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    onPlayPause,
    onSeek,
    onVolumeChange,
    onMuteToggle,
    onFullscreen,
    qualityLevels,
    selectedQuality,
    onQualityChange,
    hidden = false,
    className,
}: VideoControlsProps) => {
    /** Whether to render the DASH quality selector. */
    const hasQuality = useMemo(
        () => Boolean(
            qualityLevels && qualityLevels.length > 0 && onQualityChange,
        ),
        [
            qualityLevels,
            onQualityChange,
        ],
    )

    /** Visibility classes toggled by the `hidden` flag. */
    const visibilityClassName = useMemo(
        () => (hidden ? "pointer-events-none opacity-0" : "opacity-100"),
        [
            hidden,
        ],
    )

    return (
        <div
            className={cn(
                "absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-black/80 via-black/40 to-transparent px-3 pb-3 pt-8 transition-opacity duration-300",
                visibilityClassName,
                className,
            )}
        >
            <SeekBar
                currentTime={currentTime}
                duration={duration}
                onSeek={onSeek}
            />

            <div className="flex items-center justify-between gap-1.5">
                <div className="flex items-center gap-1.5">
                    <PlayPauseButton
                        isPlaying={isPlaying}
                        onPlayPause={onPlayPause}
                    />

                    <VolumeControl
                        volume={volume}
                        isMuted={isMuted}
                        onVolumeChange={onVolumeChange}
                        onMuteToggle={onMuteToggle}
                    />

                    <TimeDisplay
                        currentTime={currentTime}
                        duration={duration}
                    />
                </div>

                <div className="flex items-center gap-1.5">
                    {hasQuality && onQualityChange ? (
                        <QualitySelector
                            qualityLevels={qualityLevels ?? []}
                            selectedQuality={selectedQuality ?? -1}
                            onQualityChange={onQualityChange}
                        />
                    ) : null}

                    {onFullscreen ? (
                        <FullscreenButton onFullscreen={onFullscreen} />
                    ) : null}
                </div>
            </div>
        </div>
    )
}
