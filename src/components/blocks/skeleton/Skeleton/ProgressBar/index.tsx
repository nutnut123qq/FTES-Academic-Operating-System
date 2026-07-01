import React from "react"
import { Skeleton, cn } from "@heroui/react"
import type { WithClassNames } from "@/modules/types/base/class-name"

/** Props for {@link SkeletonProgressBar}. */
export interface SkeletonProgressBarProps extends WithClassNames<undefined> {
    // No part-specific props; width is controlled via className.
}

/**
 * Skeleton matching a HeroUI <ProgressBar/> track.
 * ProgressBar track: h-2, full-width bar.
 */
export const SkeletonProgressBar = ({ className }: SkeletonProgressBarProps) => {
    return <Skeleton className={cn("h-2 w-full rounded-full", className)} />
}
