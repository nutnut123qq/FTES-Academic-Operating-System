"use client"

import React from "react"
import { Skeleton } from "@/components/blocks/skeleton/Skeleton"

/** Props for {@link SkillExpChartSkeleton}. */
export interface SkillExpChartSkeletonProps {
    /** How many bar rows to draw — match the expected category count. Defaults to 10. */
    barCount?: number
}

/**
 * Loading skeleton mirroring the EXP chart: one label/value row + `h-2` track per
 * category, the axis footer, and the scale caption — so the section keeps its height
 * and nothing jumps when the totals land.
 */
export const SkillExpChartSkeleton = ({ barCount = 10 }: SkillExpChartSkeletonProps) => (
    <div className="flex flex-col gap-3">
        {Array.from({ length: barCount }).map((_, index) => (
            <div key={index} className="flex flex-col gap-2">
                <div className="flex items-baseline justify-between gap-3">
                    <Skeleton.Typography type="body-xs" width="1/3" />
                    <Skeleton className="my-1 h-3 w-12 shrink-0 rounded" />
                </div>
                <Skeleton className="h-2 w-full rounded-full" />
            </div>
        ))}
        <div className="flex items-baseline justify-between gap-3">
            <Skeleton className="my-1 h-3 w-6 rounded" />
            <Skeleton className="my-1 h-3 w-12 rounded" />
        </div>
        <Skeleton.Typography type="body-xs" width="2/3" />
    </div>
)
