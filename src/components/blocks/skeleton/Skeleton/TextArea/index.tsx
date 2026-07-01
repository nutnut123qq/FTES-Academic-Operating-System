import React from "react"
import { Skeleton, cn } from "@heroui/react"
import type { WithClassNames } from "@/modules/types/base/class-name"

/** Props for {@link SkeletonTextArea}. */
export interface SkeletonTextAreaProps extends WithClassNames<undefined> {
    /**
     * Number of text rows the textarea renders.
     * Defaults to 3 (real <TextArea/> min-height is 38px ~ 1 row, but the
     * common authored size is multi-row).
     */
    rows?: number
}

/**
 * Skeleton matching a HeroUI <TextArea/> field box (multi-row).
 * Real textarea: px-3 py-2, text-base/sm:text-sm, min-height 38px, rounded-field.
 * Approximate body glyph rows (h-4) stacked with line spacing inside the field box,
 * wrapped in a rounded-field container to preserve the box footprint.
 */
export const SkeletonTextArea = ({ rows = 3, className }: SkeletonTextAreaProps) => {
    return (
        <div
            className={cn(
                "flex flex-col gap-2.5 rounded-xl px-3 py-2",
                className,
            )}
        >
            {Array.from({ length: rows }).map((_, index) => (
                <Skeleton
                    key={index}
                    className={cn(
                        "h-4 rounded",
                        index === rows - 1 ? "w-2/3" : "w-full",
                    )}
                />
            ))}
        </div>
    )
}
