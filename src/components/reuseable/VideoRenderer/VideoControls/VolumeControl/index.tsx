"use client"

import { Volume as SpeakerHighIcon, VolumeSlash as SpeakerSlashIcon } from "@gravity-ui/icons"
import React from "react"
import { Button, cn, Popover, Slider } from "@heroui/react"
import { useCallback, useMemo } from "react"
import type { WithClassNames } from "@/modules/types/base/class-name"


/** Props for {@link VolumeControl}. */
export interface VolumeControlProps extends WithClassNames<undefined> {
    /** Current volume in the `0..1` range. */
    volume: number
    /** Whether audio is currently muted. */
    isMuted: boolean
    /** Fired with the requested volume in the `0..1` range. */
    onVolumeChange: (vol: number) => void
    /** Fired when the user toggles mute. */
    onMuteToggle: () => void
}

/**
 * Mute toggle button with a popover volume slider.
 *
 * Presentational: derives icon + effective slider value, no logic.
 * @param props - Volume, mute state, and the change/toggle callbacks.
 */
export const VolumeControl = ({
    volume,
    isMuted,
    onVolumeChange,
    onMuteToggle,
    className,
}: VolumeControlProps) => {
    /** Slider should sit at zero whenever audio is muted. */
    const sliderValue = useMemo(
        () => (isMuted ? 0 : volume),
        [
            isMuted,
            volume,
        ],
    )

    /** Whether to render the muted icon (explicitly muted or silent). */
    const isSilent = useMemo(
        () => isMuted || volume === 0,
        [
            isMuted,
            volume,
        ],
    )

    /** Normalize the slider value to a number before bubbling the change. */
    const onChange = useCallback(
        (value: number | Array<number>) => onVolumeChange(value as number),
        [
            onVolumeChange,
        ],
    )

    return (
        <Popover>
            <Popover.Trigger>
                <Button
                    isIconOnly
                    variant="ghost"
                    aria-label="Volume"
                    onPress={onMuteToggle}
                    className={cn("text-white hover:bg-white/20 border-none min-w-8 h-8", className)}
                >
                    {isSilent ? (
                        <SpeakerSlashIcon className="h-5 w-5" />
                    ) : (
                        <SpeakerHighIcon className="h-5 w-5" />
                    )}
                </Button>
            </Popover.Trigger>
            <Popover.Content className="w-8 bg-black/90 p-2">
                <Slider
                    aria-label="Volume"
                    orientation="vertical"
                    step={0.01}
                    minValue={0}
                    maxValue={1}
                    value={sliderValue}
                    onChange={onChange}
                    className="h-20"
                />
            </Popover.Content>
        </Popover>
    )
}
