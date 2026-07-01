import React from "react"
import { Skeleton } from "@heroui/react"
import type { WithClassNames } from "@/modules/types/base/class-name"

/** Props for {@link SystemStatusSkeleton}. */
export interface SystemStatusSkeletonProps extends WithClassNames<undefined> {
    /** When true, render only the AI key group mirror (the AI section loads on its own). */
    aiOnly?: boolean
}

/** A single component-card placeholder mirroring {@link ComponentCard}. */
const ComponentCardSkeleton = () => (
    <div className="flex flex-col gap-2 rounded-large border border-default bg-surface p-4">
        <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
                <Skeleton className="size-2.5 rounded-full" />
                <Skeleton className="h-4 w-20 rounded" />
            </div>
            <Skeleton className="h-5 w-16 rounded-full" />
        </div>
        <div className="flex items-center justify-between gap-2">
            <Skeleton className="h-3 w-10 rounded" />
            <Skeleton className="h-3 w-24 rounded" />
        </div>
    </div>
)

/** A single AI key group placeholder mirroring {@link AiKeyGroup}. */
const AiKeyGroupSkeleton = () => (
    <div className="flex flex-col gap-3 rounded-large border border-default bg-surface p-4">
        <Skeleton className="h-4 w-2/3 rounded" />
        <div className="flex flex-wrap gap-1.5">
            {Array.from({ length: 5 }).map((_, index) => (
                <Skeleton key={index} className="h-5 w-20 rounded-full" />
            ))}
        </div>
    </div>
)

/**
 * Loading mirror for {@link import("../index").SystemStatus}. Matches the real
 * banner + infrastructure grid + AI key group rhythm so the layout never jumps
 * when data resolves. Pass `aiOnly` to mirror just the AI section.
 */
export const SystemStatusSkeleton = ({ aiOnly = false }: SystemStatusSkeletonProps) => {
    if (aiOnly) {
        return (
            <div className="flex flex-col gap-3">
                {Array.from({ length: 2 }).map((_, index) => (
                    <AiKeyGroupSkeleton key={index} />
                ))}
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-6">
            {/* overall banner */}
            <Skeleton className="h-14 w-full rounded-2xl" />
            {/* infrastructure grid */}
            <div className="flex flex-col gap-3">
                <Skeleton className="h-4 w-32 rounded" />
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {Array.from({ length: 6 }).map((_, index) => (
                        <ComponentCardSkeleton key={index} />
                    ))}
                </div>
            </div>
        </div>
    )
}
