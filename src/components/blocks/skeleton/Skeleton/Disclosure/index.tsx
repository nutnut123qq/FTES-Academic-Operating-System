import React from "react"
import { Skeleton, cn } from "@heroui/react"
import type { WithClassNames } from "@/modules/types/base/class-name"

/** Props for {@link SkeletonDisclosure}. */
export interface SkeletonDisclosureProps extends WithClassNames<undefined> {
    // Single trigger row; no part-specific props needed.
}

/**
 * Skeleton matching a HeroUI <Disclosure/> trigger row: an inline label bar
 * (text-sm/leading-5 -> h-[14px] my-[3px]) with a trailing size-4 indicator.
 */
export const SkeletonDisclosure = ({ className }: SkeletonDisclosureProps) => {
    return (
        <div className={cn("relative flex items-center gap-2", className)}>
            <Skeleton className="my-[3px] h-[14px] w-2/5 rounded" />
            <Skeleton className="ml-auto size-4 shrink-0 rounded" />
        </div>
    )
}
