import React from "react"
import { Skeleton, cn } from "@heroui/react"
import type { WithClassNames } from "@/modules/types/base/class-name"

/** Props for {@link SkeletonSwitch}. */
export interface SkeletonSwitchProps extends WithClassNames<undefined> {
    // No part-specific props.
}

/**
 * Skeleton matching a HeroUI <Switch/> track.
 * The app globals.css override sizes the track to 2.25rem (h-9) × 4rem (w-16),
 * a fully rounded pill matching the navbar icon buttons (36px tall).
 */
export const SkeletonSwitch = ({ className }: SkeletonSwitchProps) => {
    return <Skeleton className={cn("h-9 w-16 rounded-full", className)} />
}
