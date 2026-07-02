"use client"

import React from "react"
import { Skeleton } from "@/components/blocks/skeleton/Skeleton"

/** Props for {@link SkillGraphSkeleton}. */
export interface SkillGraphSkeletonProps {
    /** Tailwind height class for the canvas area, mirroring the real graph height. */
    heightClassName?: string
}

/**
 * Loading skeleton mirroring the graph layout: a toolbar row (filter chips + a
 * legend block) and the canvas area, so the box never collapses on resolve.
 */
export const SkillGraphSkeleton = ({ heightClassName = "h-[480px]" }: SkillGraphSkeletonProps) => (
    <div className="flex flex-col gap-3">
        <div className="flex flex-wrap gap-2">
            {Array.from({ length: 5 }).map((_, index) => (
                <Skeleton key={index} className="h-8 w-20 rounded-large" />
            ))}
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
            <Skeleton className={`w-full flex-1 rounded-large ${heightClassName}`} />
            <Skeleton className="h-40 w-full rounded-large sm:w-56" />
        </div>
    </div>
)
