import React from "react"
import { Skeleton, cn } from "@heroui/react"
import type { WithClassNames } from "@/modules/types/base/class-name"

/** Props for {@link SkeletonTable}. */
export interface SkeletonTableProps extends WithClassNames<undefined> {
    /** Number of body rows to render. Defaults to 5. */
    rows?: number
    /** Number of columns per row. Defaults to 4. */
    cols?: number
}

/**
 * Skeleton matching a HeroUI <Table/> body. Each cell uses `px-4 py-3` with
 * `text-sm` content (14/20), so a cell box is 44px tall and the glyph bar is
 * `h-[14px]` (body-sm) centered with `my-[5px]` inside the `py-3` padding.
 */
export const SkeletonTable = ({ rows = 5, cols = 4, className }: SkeletonTableProps) => {
    return (
        <div className={cn("flex w-full flex-col", className)}>
            {Array.from({ length: rows }).map((_, rowIndex) => (
                <div key={rowIndex} className="flex w-full items-center gap-4 px-4 py-3">
                    {Array.from({ length: cols }).map((_, colIndex) => (
                        <Skeleton
                            key={colIndex}
                            className="my-[5px] h-[14px] flex-1 rounded"
                        />
                    ))}
                </div>
            ))}
        </div>
    )
}
