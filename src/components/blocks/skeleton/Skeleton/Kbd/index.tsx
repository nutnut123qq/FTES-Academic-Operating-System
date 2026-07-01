import React from "react"
import { Skeleton, cn } from "@heroui/react"
import type { WithClassNames } from "@/modules/types/base/class-name"

/** Props for {@link SkeletonKbd}. */
export interface SkeletonKbdProps extends WithClassNames<undefined> {
    // No part-specific props; width is controlled via className.
}

/**
 * Skeleton matching a HeroUI <Kbd/> box.
 * Kbd: h-6 rounded-lg px-2.
 */
export const SkeletonKbd = ({ className }: SkeletonKbdProps) => {
    return <Skeleton className={cn("h-6 w-10 rounded-lg", className)} />
}
