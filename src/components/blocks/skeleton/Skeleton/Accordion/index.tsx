import React from "react"
import { Skeleton, cn } from "@heroui/react"
import type { WithClassNames } from "@/modules/types/base/class-name"

/** Props for {@link SkeletonAccordion}. */
export interface SkeletonAccordionProps extends WithClassNames<undefined> {
    /** Number of accordion items. Defaults to 3. */
    items?: number
}

/**
 * Skeleton matching a HeroUI <Accordion/>: each item is a trigger row
 * (px-4 py-4 + text-sm/leading-6 -> h-14 box) followed by a 1px separator
 * (the last item has no separator, matching :last-child::after { none }).
 */
export const SkeletonAccordion = ({
    className,
    items = 3,
}: SkeletonAccordionProps) => {
    return (
        <div className={cn("w-full", className)}>
            {Array.from({ length: items }).map((_, index) => (
                <div key={index} className="relative">
                    {/* Trigger row (h-14): label bar + indicator */}
                    <div className="flex h-14 items-center justify-between px-4">
                        <Skeleton className="my-[5px] h-[14px] w-2/5 rounded" />
                        <Skeleton className="size-4 rounded" />
                    </div>
                    {/* Separator (h-px), omitted on the last item */}
                    {index < items - 1 && (
                        <Skeleton className="h-px w-full rounded-xs" />
                    )}
                </div>
            ))}
        </div>
    )
}
