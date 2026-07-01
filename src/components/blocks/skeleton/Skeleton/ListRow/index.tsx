import React from "react"
import { Skeleton, cn } from "@heroui/react"
import type { WithClassNames } from "@/modules/types/base/class-name"

/** Props for {@link SkeletonListRow}. */
export interface SkeletonListRowProps extends WithClassNames<undefined> {
    /** When true, renders the secondary subtitle bar. Defaults to true. */
    withSubtitle?: boolean
    /** When true, renders the leading icon/avatar dot. Defaults to true. */
    withLeading?: boolean
    /** When true, renders a right-aligned trailing cluster (icon + short label). Defaults to false. */
    withTrailing?: boolean
}

/**
 * Skeleton matching the {@link import("@/components/blocks").ListRow} block:
 * `flex items-center gap-3 py-2` with an optional leading node, a title line
 * (`body-sm` 14/24) and an optional subtitle line (`body-xs` 12/20), plus an
 * optional right-aligned trailing cluster (mirrors a `meta`/`trailing` slot such
 * as a repo link).
 *
 * - Leading dot: `size-5` rounded-full (icon/avatar slot) — omit via `withLeading={false}`.
 * - Title bar: `h-3 w-1/2` (body-xs glyph height, centered with `my-1`).
 * - Subtitle bar: `h-3 w-1/3`.
 * - Trailing cluster: `size-4` icon + `h-3 w-10` label, `ml-auto`.
 */
export const SkeletonListRow = ({
    withSubtitle = true,
    withLeading = true,
    withTrailing = false,
    className,
}: SkeletonListRowProps) => {
    return (
        <div className={cn("flex min-w-0 items-center gap-3 py-2", className)}>
            {withLeading ? <Skeleton className="size-5 shrink-0 rounded-full" /> : null}
            {/* flex-1 so the % widths resolve against a real column (else collapse to 0) */}
            <div className="flex min-w-0 flex-1 flex-col gap-0">
                <Skeleton className="my-1 h-3 w-1/2 rounded" />
                {withSubtitle ? <Skeleton className="my-1 h-3 w-1/3 rounded" /> : null}
            </div>
            {withTrailing ? (
                <div className="ml-auto flex shrink-0 items-center gap-2">
                    <Skeleton className="size-4 rounded" />
                    <Skeleton className="h-3 w-10 rounded" />
                </div>
            ) : null}
        </div>
    )
}
