"use client"

import React from "react"
import {
    SkeletonText,
    type SkeletonTextSize,
} from "../SkeletonText"
import type { WithClassNames } from "@/modules/types/base/class-name"

/**
 * Stepped widths cycled across paragraph lines so the block reads like real
 * prose (full lines with a shorter trailing line) instead of a solid rectangle.
 * Default 3-line progression reads 100% → 75% → 50%.
 */
const stepWidths = ["w-full", "w-3/4", "w-1/2"] as const

export interface SkeletonParagraphProps extends WithClassNames<undefined> {
    /** Typography token shared by every line; drives each bar's height. */
    size: SkeletonTextSize
    /** Number of skeleton lines to render. Defaults to `3`. */
    lines?: number
}

/**
 * A multi-line text skeleton: renders `lines` {@link SkeletonText} bars with
 * stepped, decreasing widths so the final line reads shorter, mimicking a real
 * paragraph.
 * @param props - {@link SkeletonParagraphProps}
 */
export const SkeletonParagraph = (props: SkeletonParagraphProps) => {
    const {
        size,
        lines = 3,
        className,
    } = props
    return (
        <div className={className}>
            {Array.from({ length: Math.max(lines, 0) }).map((_unused, index) => {
                // Last line is always the shortest; earlier lines cycle the
                // stepped widths so long paragraphs keep a natural rhythm.
                const isLast = index === lines - 1
                const width = isLast
                    ? stepWidths[stepWidths.length - 1]
                    : stepWidths[Math.min(index, stepWidths.length - 2)]
                return (
                    <SkeletonText
                        key={index}
                        size={size}
                        width={width}
                    />
                )
            })}
        </div>
    )
}
