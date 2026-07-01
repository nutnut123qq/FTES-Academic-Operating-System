import React from "react"
import { Skeleton, cn } from "@heroui/react"
import type { WithClassNames } from "@/modules/types/base/class-name"

/**
 * Props for {@link SkeletonMetric}.
 *
 * No part-specific props: a fixed value + label stack matching a single metric.
 */
export interface SkeletonMetricProps extends WithClassNames<undefined> {
    // No part-specific props.
}

/**
 * Skeleton matching a single metric (value + label), e.g. the inner content of
 * a {@link import("@/components/blocks").MetricCard}. Stacks a prominent value
 * bar over a muted label bar with `gap-2`.
 *
 * - Value bar: `h-7 w-16` (large headline value).
 * - Label bar: `h-3 w-24` (body-xs glyph height for the descriptor).
 */
export const SkeletonMetric = ({ className }: SkeletonMetricProps) => {
    return (
        <div className={cn("flex flex-col gap-2", className)}>
            <Skeleton className="h-7 w-16 rounded" />
            <Skeleton className="my-1 h-3 w-24 rounded" />
        </div>
    )
}
