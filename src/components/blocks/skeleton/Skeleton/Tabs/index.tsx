import React from "react"
import { Skeleton, cn } from "@heroui/react"
import type { WithClassNames } from "@/modules/types/base/class-name"

/** Props for {@link SkeletonTabs}. */
export interface SkeletonTabsProps extends WithClassNames<undefined> {
    /** Number of tab bars. Defaults to 3. */
    count?: number
}

/**
 * Skeleton matching a HeroUI <Tabs/> list: an inline pill container (p-1)
 * holding count tab bars, each h-8 (rounded-3xl pill). The container box is
 * 32 + 8 = 40px tall, matching the real tab list.
 */
export const SkeletonTabs = ({ className, count = 3 }: SkeletonTabsProps) => {
    return (
        <div
            className={cn(
                "inline-flex gap-2 rounded-[calc(var(--radius)*2.5)] bg-default p-1",
                className,
            )}
        >
            {Array.from({ length: count }).map((_, index) => (
                <Skeleton key={index} className="h-8 w-20 rounded-3xl" />
            ))}
        </div>
    )
}
