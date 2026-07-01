import React from "react"
import { Skeleton, cn } from "@heroui/react"
import type { WithClassNames } from "@/modules/types/base/class-name"

/** Props for {@link SkeletonPagination}. */
export interface SkeletonPaginationProps extends WithClassNames<undefined> {
    /** Number of page squares. Defaults to 5. */
    count?: number
}

/**
 * Skeleton matching a HeroUI <Pagination/> content row: count page squares,
 * each size-9 md:size-8 (rounded-3xl), laid out with gap-1.
 */
export const SkeletonPagination = ({
    className,
    count = 5,
}: SkeletonPaginationProps) => {
    return (
        <div className={cn("flex items-center gap-1", className)}>
            {Array.from({ length: count }).map((_, index) => (
                <Skeleton
                    key={index}
                    className="size-9 rounded-3xl md:size-8"
                />
            ))}
        </div>
    )
}
