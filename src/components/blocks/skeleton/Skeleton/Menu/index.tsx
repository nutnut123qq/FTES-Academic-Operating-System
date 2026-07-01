import React from "react"
import { Skeleton, cn } from "@heroui/react"
import type { WithClassNames } from "@/modules/types/base/class-name"

/** Props for {@link SkeletonMenu}. */
export interface SkeletonMenuProps extends WithClassNames<undefined> {
    /** Number of menu-item rows to render. Defaults to 4. */
    items?: number
}

/**
 * Skeleton matching a `Dropdown.Menu` of icon + label items (e.g. the account
 * menu). The menu has `p-1`; each item is `flex items-center gap-2 px-2 py-2`
 * with a leading `size-5` icon and a single `body-sm` label. Mirrors exactly
 * that — a round `size-5` icon placeholder + ONE short text bar per row. No
 * full-width bars, no subtitle (a menu row is just icon + text).
 */
export const SkeletonMenu = ({ items = 4, className }: SkeletonMenuProps) => {
    return (
        <div className={cn("flex w-full flex-col gap-1 p-1", className)}>
            {Array.from({ length: items }).map((_, index) => (
                <div
                    key={index}
                    className="flex items-center gap-2 px-2 py-2"
                >
                    <Skeleton className="size-5 shrink-0 rounded-full" />
                    <Skeleton className="h-[14px] w-24 rounded" />
                </div>
            ))}
        </div>
    )
}
