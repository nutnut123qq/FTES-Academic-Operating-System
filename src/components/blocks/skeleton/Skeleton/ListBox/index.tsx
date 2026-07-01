import React from "react"
import { Skeleton, cn } from "@heroui/react"
import type { WithClassNames } from "@/modules/types/base/class-name"

/** Props for {@link SkeletonListBox}. */
export interface SkeletonListBoxProps extends WithClassNames<undefined> {
    /** Number of option rows to render. Defaults to 4. */
    items?: number
}

/**
 * Skeleton matching a HeroUI <ListBox/>. The list-box has `p-1` and stacks
 * children with `mt-1` (gap-1). Each option row carries `body-sm` (14/24)
 * single-line text, so the glyph bar is `h-[14px]` centered with `my-[5px]`
 * and rounded to match an option's `rounded-lg` shape.
 */
export const SkeletonListBox = ({ items = 4, className }: SkeletonListBoxProps) => {
    return (
        <div className={cn("flex w-full flex-col gap-1 p-1", className)}>
            {Array.from({ length: items }).map((_, index) => (
                <Skeleton
                    key={index}
                    className="my-[5px] h-[14px] w-full rounded-lg"
                />
            ))}
        </div>
    )
}
