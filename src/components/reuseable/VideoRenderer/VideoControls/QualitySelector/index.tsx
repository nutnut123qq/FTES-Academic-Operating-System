"use client"

import { Gear as GearSixIcon } from "@gravity-ui/icons"
import React from "react"
import {
    cn,
    Dropdown,
    DropdownItem,
    DropdownMenu,
    DropdownTrigger,
} from "@heroui/react"
import { useCallback, useMemo } from "react"
import { AUTO_QUALITY_INDEX } from "../constants"
import type { QualityLevel } from "../types"
import type { WithClassNames } from "@/modules/types/base/class-name"

/** Props for {@link QualitySelector}. */
export interface QualitySelectorProps extends WithClassNames<undefined> {
    /** Available quality renditions (excluding the synthetic Auto entry). */
    qualityLevels: Array<QualityLevel>
    /** Currently selected quality index (`-1` = auto). */
    selectedQuality: number
    /** Fired with the chosen quality index. */
    onQualityChange: (index: number) => void
}

/**
 * Dropdown that lets the viewer pin an adaptive bitrate / quality level.
 *
 * Presentational: prepends a synthetic "Auto" option and forwards the
 * selected key, no playback logic.
 * @param props - Levels, current selection, and the change callback.
 */
export const QualitySelector = ({
    qualityLevels,
    selectedQuality,
    onQualityChange,
    className,
}: QualitySelectorProps) => {
    /** Human-readable label for a quality level. */
    const qualityLabel = useCallback(
        (quality: QualityLevel) =>
            quality.index === AUTO_QUALITY_INDEX
                ? "Auto"
                : `${quality.height}p (${Math.round(quality.bitrate / 1000)}k)`,
        [],
    )

    /** All quality options including the synthetic Auto entry. */
    const allQualities = useMemo<Array<QualityLevel>>(
        () => [
            {
                index: AUTO_QUALITY_INDEX,
                height: 0,
                bitrate: 0,
            },
            ...qualityLevels,
        ],
        [
            qualityLevels,
        ],
    )

    /** Currently selected dropdown key set. */
    const selectedKeys = useMemo(
        () => new Set([
            String(selectedQuality ?? AUTO_QUALITY_INDEX),
        ]),
        [
            selectedQuality,
        ],
    )

    /** Resolve the chosen key back into a numeric quality index. */
    const onSelectionChange = useCallback(
        (keys: "all" | Set<React.Key>) => {
            if (keys === "all") return
            const key = Array.from(keys)[0]
            if (key !== undefined) {
                onQualityChange(Number(key))
            }
        },
        [
            onQualityChange,
        ],
    )

    return (
        <Dropdown className={cn(className)}>
            <DropdownTrigger aria-label="Quality">
                <div className="flex h-8 min-w-8 cursor-pointer items-center justify-center rounded-medium border-none text-white hover:bg-white/20">
                    <GearSixIcon className="h-5 w-5" />
                </div>
            </DropdownTrigger>
            <DropdownMenu
                aria-label="Quality levels"
                selectionMode="single"
                selectedKeys={selectedKeys}
                onSelectionChange={onSelectionChange}
            >
                {allQualities.map((quality) => (
                    <DropdownItem key={String(quality.index)}>
                        {qualityLabel(quality)}
                    </DropdownItem>
                ))}
            </DropdownMenu>
        </Dropdown>
    )
}
