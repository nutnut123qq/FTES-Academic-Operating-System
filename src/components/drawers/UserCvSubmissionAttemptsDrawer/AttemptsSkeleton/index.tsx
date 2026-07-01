"use client"

import React from "react"
import {
    ScrollShadow,
    Skeleton,
} from "@heroui/react"

/** Number of placeholder rows shown while attempts load. */
const SKELETON_ROW_COUNT = 5

/**
 * Loading placeholder for the attempts list.
 *
 * Presentational: renders a fixed set of pulsing rows, no logic.
 */
export const AttemptsSkeleton = () => {
    return (
        <ScrollShadow
            className="min-h-0 flex-1 overflow-x-hidden p-3"
            hideScrollBar
        >
            <div className="flex flex-col gap-1.5">
                {Array.from({ length: SKELETON_ROW_COUNT }).map((_, index) => (
                    <Skeleton
                        key={index}
                        className="h-12 rounded-lg"
                    />
                ))}
            </div>
        </ScrollShadow>
    )
}
