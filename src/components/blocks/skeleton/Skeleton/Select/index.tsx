import React from "react"
import { Skeleton, cn } from "@heroui/react"
import type { WithClassNames } from "@/modules/types/base/class-name"

/** Props for {@link SkeletonSelect}. */
export interface SkeletonSelectProps extends WithClassNames<undefined> {
    // No part-specific props: a single field-height trigger with chevron.
}

/**
 * Skeleton matching a HeroUI <Select/> trigger box.
 * Trigger: min-h-9 (36px), rounded-field (rounded-xl), pe-7 reserves space for
 * the trailing chevron indicator. We render the field bar plus a small square
 * block on the trailing edge to mirror the chevron footprint.
 */
export const SkeletonSelect = ({ className }: SkeletonSelectProps) => {
    return (
        <div className={cn("relative w-full", className)}>
            <Skeleton className="h-9 w-full rounded-xl" />
            <Skeleton className="absolute end-3 top-1/2 size-4 -translate-y-1/2 rounded" />
        </div>
    )
}
