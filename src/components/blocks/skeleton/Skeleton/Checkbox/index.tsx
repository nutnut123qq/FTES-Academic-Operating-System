import React from "react"
import { Skeleton, cn } from "@heroui/react"
import type { WithClassNames } from "@/modules/types/base/class-name"

/** Props for {@link SkeletonCheckbox}. */
export interface SkeletonCheckboxProps extends WithClassNames<undefined> {
    /** Render the label line next to the box. Defaults to true. */
    withLabel?: boolean
    /** Full Tailwind width class for the label bar, e.g. "w-32". Defaults to "w-32". */
    labelWidth?: string
}

/**
 * Skeleton matching a HeroUI <Checkbox/>.
 * Control is size-4 (16px) rounded-md; the label uses text-sm (body-sm 14/24),
 * so the label bar is the 14px glyph height centered in its 24px box (my-[5px]).
 * Row is gap-3 to match the checkbox label gap.
 */
export const SkeletonCheckbox = ({
    className,
    withLabel = true,
    labelWidth = "w-32",
}: SkeletonCheckboxProps) => {
    return (
        <div className={cn("flex items-center gap-3", className)}>
            <Skeleton className="size-4 shrink-0 rounded-md" />
            {withLabel && <Skeleton className={cn("h-[14px] my-[5px] rounded", labelWidth)} />}
        </div>
    )
}
