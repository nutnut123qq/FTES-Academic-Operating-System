import React from "react"
import { Skeleton, cn } from "@heroui/react"
import type { WithClassNames } from "@/modules/types/base/class-name"

/** Props for {@link SkeletonUserCell}. */
export interface SkeletonUserCellProps extends WithClassNames<undefined> {
    /** When true, renders the secondary handle bar. Defaults to true. */
    withHandle?: boolean
}

/**
 * Skeleton matching the {@link import("@/components/blocks").UserCell} block:
 * `flex items-center gap-2` with an avatar plus a name line (`body-sm` 14/24)
 * and an optional `@handle` line (`body-xs` 12/20).
 *
 * - Avatar: `size-9` rounded-full (36px).
 * - Name bar: `h-3 w-24` in a 20px box (`my-1`) — matches name `leading-5`.
 * - Handle bar: `h-3 w-16` in a 16px box (`my-0.5`) — matches handle `leading-4`.
 *   Name + handle = 36px, level with the avatar.
 */
export const SkeletonUserCell = ({ withHandle = true, className }: SkeletonUserCellProps) => {
    return (
        <div className={cn("flex min-w-0 items-center gap-2", className)}>
            <Skeleton className="size-9 shrink-0 rounded-full" />
            <div className="flex min-w-0 flex-col gap-0">
                <Skeleton className="my-1 h-3 w-24 rounded" />
                {withHandle ? <Skeleton className="my-0.5 h-3 w-16 rounded" /> : null}
            </div>
        </div>
    )
}
