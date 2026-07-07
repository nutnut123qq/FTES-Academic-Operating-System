"use client"

import React from "react"
import {
    Card,
    Skeleton,
    cn,
} from "@heroui/react"
import type { WithClassNames } from "@/modules/types/base/class-name"

/** Props for {@link AdminAiBalancerSkeleton}. */
export interface AdminAiBalancerSkeletonProps extends WithClassNames<undefined> {
    /** Number of placeholder provider sections. Defaults to `3`. */
    count?: number
}

/**
 * Loading placeholder for {@link AdminAiBalancer}. Mirrors the provider sections:
 * a glass card with a provider heading + summary pills and a few key-table rows.
 * @param props - {@link AdminAiBalancerSkeletonProps}
 */
export const AdminAiBalancerSkeleton = ({
    count = 3,
    className,
}: AdminAiBalancerSkeletonProps) => {
    return (
        <div className={cn("flex flex-col gap-6", className)}>
            {Array.from({ length: Math.max(count, 1) }).map((_unused, cardIndex) => (
                <Card
                    key={cardIndex}
                    className="border border-white/10 bg-white/5 backdrop-blur-xl"
                >
                    <Card.Content className="gap-3 px-4 py-3">
                        {/* provider heading + summary pills */}
                        <div className="flex flex-wrap items-start justify-between gap-3">
                            <div className="flex flex-col gap-2">
                                <Skeleton className="h-5 w-32 rounded" />
                                <Skeleton className="h-3 w-48 rounded" />
                            </div>
                            <div className="flex flex-wrap gap-2">
                                <Skeleton className="h-6 w-20 rounded-full" />
                                <Skeleton className="h-6 w-20 rounded-full" />
                                <Skeleton className="h-6 w-20 rounded-full" />
                            </div>
                        </div>
                        {/* key table */}
                        <div className="flex flex-col gap-2 rounded-xl border border-white/5 p-3">
                            {Array.from({ length: 3 }).map((_unusedRow, rowIndex) => (
                                <Skeleton
                                    key={rowIndex}
                                    className="h-8 w-full rounded-xl"
                                />
                            ))}
                        </div>
                    </Card.Content>
                </Card>
            ))}
        </div>
    )
}
