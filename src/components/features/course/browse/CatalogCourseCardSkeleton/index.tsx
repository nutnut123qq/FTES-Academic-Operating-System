import React from "react"
import { cn } from "@heroui/react"
import { Skeleton } from "@/components/blocks/skeleton/Skeleton"
import type { WithClassNames } from "@/modules/types/base/class-name"

/**
 * Loading placeholder for one {@link CatalogCourseCard} — mirrors the real box
 * (inset 16:9 cover, 2-line title, course code, one meta row) per the house
 * skeleton rule.
 */
export const CatalogCourseCardSkeleton = ({ className }: WithClassNames<undefined>) => (
    <div className={cn("flex flex-col rounded-lg border border-separator p-3", className)}>
        <Skeleton className="aspect-video w-full rounded-md" />
        <div className="flex flex-col gap-1.5 pt-3">
            {/* title (2 lines) */}
            <Skeleton className="h-5 w-full rounded-large" />
            <Skeleton className="h-5 w-3/5 rounded-large" />
            {/* course code */}
            <Skeleton className="h-3 w-20 rounded-large" />
            {/* meta row: level · rating · learners */}
            <Skeleton className="h-3 w-40 rounded-large" />
        </div>
    </div>
)
