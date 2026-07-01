import React from "react"
import { Skeleton, cn } from "@heroui/react"
import type { WithClassNames } from "@/modules/types/base/class-name"

/** Props for {@link SkeletonSegmentBar}. */
export interface SkeletonSegmentBarProps extends WithClassNames<undefined> {
    /** How many legend entries to draw under the bar. Defaults to 3. */
    legendItems?: number
}

/**
 * Skeleton matching the {@link import("@/components/blocks").SegmentBar} block:
 * a thin `h-2` rounded track over a `flex-wrap` legend of colour-dot + label.
 * Mirrors the bar AND the legend so the loading state doesn't jump when the real
 * distribution arrives. Pass `legendItems` to match the expected slice count.
 */
export const SkeletonSegmentBar = ({ legendItems = 3, className }: SkeletonSegmentBarProps) => {
    return (
        <div className={cn("flex flex-col gap-2", className)}>
            {/* the proportion track */}
            <Skeleton className="h-2 w-full rounded-full" />
            {/* legend: dot + label per slice */}
            <div className="flex flex-wrap gap-x-3 gap-y-2">
                {Array.from({ length: legendItems }).map((_, index) => (
                    <div key={index} className="flex items-center gap-2">
                        <Skeleton className="size-2 shrink-0 rounded-full" />
                        <Skeleton className="my-1 h-3 w-12 rounded" />
                    </div>
                ))}
            </div>
        </div>
    )
}
