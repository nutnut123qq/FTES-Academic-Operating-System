import React from "react"
import { Skeleton, cn } from "@heroui/react"
import type { WithClassNames } from "@/modules/types/base/class-name"

/** Props for {@link SkeletonRadioGroup}. */
export interface SkeletonRadioGroupProps extends WithClassNames<undefined> {
    /** Number of radio rows to render. Defaults to 3. */
    items?: number
    /** Full Tailwind width class for each label bar, e.g. "w-32". Defaults to "w-32". */
    labelWidth?: string
}

/**
 * Skeleton matching a HeroUI <RadioGroup/>.
 * Group stacks vertically with gap-4. Each radio is a circular size-4 dot
 * (rounded-full) plus a text-sm (body-sm 14/24) label bar centered in its box,
 * separated by gap-3.
 */
export const SkeletonRadioGroup = ({
    className,
    items = 3,
    labelWidth = "w-32",
}: SkeletonRadioGroupProps) => {
    return (
        <div className={cn("flex flex-col gap-4", className)}>
            {Array.from({ length: items }).map((_, index) => (
                <div key={index} className="flex items-center gap-3">
                    <Skeleton className="size-4 shrink-0 rounded-full" />
                    <Skeleton className={cn("h-[14px] my-[5px] rounded", labelWidth)} />
                </div>
            ))}
        </div>
    )
}
