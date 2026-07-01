import React from "react"
import { Skeleton, cn } from "@heroui/react"
import type { WithClassNames } from "@/modules/types/base/class-name"

/** Props for {@link SkeletonButton}. */
export interface SkeletonButtonProps extends WithClassNames<undefined> {
    /** Full Tailwind width class, e.g. "w-24" or "w-full". Defaults to "w-24". */
    width?: string
}

/**
 * Skeleton matching a HeroUI <Button/> box.
 * Button is h-10 on mobile / md:h-9 (36px) with rounded-3xl — a full pill at this height.
 */
export const SkeletonButton = ({ className, width = "w-24" }: SkeletonButtonProps) => {
    return <Skeleton className={cn("h-10 md:h-9 rounded-full", width, className)} />
}
