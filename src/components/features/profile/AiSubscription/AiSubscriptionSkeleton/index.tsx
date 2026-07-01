"use client"

import React from "react"
import {
    cn,
} from "@heroui/react"
import {
    FreeTierCardSkeleton,
} from "../FreeTierCardSkeleton"
import {
    TierCardSkeleton,
} from "../TierGrid/TierCardSkeleton"
import type { WithClassNames } from "@/modules/types/base/class-name"

export type AiSubscriptionSkeletonProps = WithClassNames<undefined>

/**
 * Loading state for the {@link AiSubscription} tier grid.
 *
 * Presentational: mirrors only the tier grid (free + three paid cards, middle
 * card includes popular chip slot). Breadcrumb + header are static chrome and
 * render outside the loading gate, so they are intentionally not skeletonized.
 * @param props.className - Optional wrapper class.
 */
export const AiSubscriptionSkeleton = ({
    className,
}: AiSubscriptionSkeletonProps) => {
    return (
        <div className={cn("grid grid-cols-1 gap-6 sm:grid-cols-2", className)}>
            <FreeTierCardSkeleton />
            <TierCardSkeleton />
            <TierCardSkeleton />
            <TierCardSkeleton />
        </div>
    )
}
