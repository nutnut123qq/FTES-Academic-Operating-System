"use client"

import React from "react"
import {
    Card,
    CardContent,
    cn,
} from "@heroui/react"
import type {
    WithClassNames,
} from "@/modules/types/base/class-name"
import { Skeleton } from "@/components/blocks/skeleton/Skeleton"

/** Number of placeholder cohort rows (mirrors the capped top rows). */
const SKELETON_ROWS = 5

/** Props for {@link LeagueCardSkeleton}. */
export type LeagueCardSkeletonProps = WithClassNames<undefined>

/**
 * Loading placeholder for {@link import("../").LeagueCard} in its framed (LabeledCard)
 * form: label outside + a card with the tier/rank line, the promote/demote legend
 * and the cohort rows, so the dashboard Community tab does not jump on resolve.
 * @param props - {@link LeagueCardSkeletonProps}
 */
export const LeagueCardSkeleton = ({ className }: LeagueCardSkeletonProps) => (
    <div className={cn("flex flex-col gap-3", className)}>
        <Skeleton.Typography type="body-sm" width="1/3" />
        <Card>
            <CardContent className="flex flex-col gap-3">
                {/* tier + rank line, then the legend */}
                <Skeleton.Typography type="body-sm" width="1/2" />
                <Skeleton.Typography type="body-xs" width="1/3" />
                {/* cohort rows */}
                <div className="flex flex-col gap-2">
                    {Array.from({ length: SKELETON_ROWS }).map((_row, index) => (
                        <div key={index} className="flex items-center gap-3">
                            <Skeleton className="size-6 shrink-0 rounded-full" />
                            <Skeleton.Typography type="body-sm" width="1/2" />
                            <Skeleton className="ml-auto h-4 w-12 shrink-0 rounded-xl" />
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    </div>
)
