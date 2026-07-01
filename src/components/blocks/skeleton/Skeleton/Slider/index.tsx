import React from "react"
import { Skeleton, cn } from "@heroui/react"
import type { WithClassNames } from "@/modules/types/base/class-name"

/** Props for {@link SkeletonSlider}. */
export interface SkeletonSliderProps extends WithClassNames<undefined> {
    // No part-specific props.
}

/**
 * Skeleton matching a HeroUI <Slider/>.
 * The track row is h-5 (rounded-xl). The thumb is a 5×5 (w-5 h-5) rounded handle
 * sitting on the track; here it is parked at the start to suggest the control.
 */
export const SkeletonSlider = ({ className }: SkeletonSliderProps) => {
    return (
        <div className={cn("relative h-5 w-full", className)}>
            <Skeleton className="absolute inset-0 h-5 w-full rounded-xl" />
            <Skeleton className="absolute top-0 left-0 size-5 rounded-xl" />
        </div>
    )
}
