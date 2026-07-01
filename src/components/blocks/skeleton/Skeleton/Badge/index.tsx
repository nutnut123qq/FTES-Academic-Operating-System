import React from "react"
import { Skeleton, cn } from "@heroui/react"
import type { WithClassNames } from "@/modules/types/base/class-name"

/** Props for {@link SkeletonBadge}. */
export interface SkeletonBadgeProps extends WithClassNames<undefined> {
    // No part-specific props; the small badge is a fixed square dot.
}

/**
 * Skeleton matching a HeroUI <Badge/> box (small size).
 * Badge --sm: min-h-4 min-w-4 → 16px square, circular shape.
 */
export const SkeletonBadge = ({ className }: SkeletonBadgeProps) => {
    return <Skeleton className={cn("size-4 rounded-full", className)} />
}
