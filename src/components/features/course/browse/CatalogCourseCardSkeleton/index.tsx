import React from "react"
import { cn } from "@heroui/react"
import { Skeleton } from "@/components/blocks/skeleton/Skeleton"
import type { WithClassNames } from "@/modules/types/base/class-name"

/**
 * Loading placeholder for one {@link CatalogCourseCard} — mirrors the real box
 * (16:9 cover + code/title/rating/meta/price rows) per the house skeleton rule.
 */
export const CatalogCourseCardSkeleton = ({ className }: WithClassNames<undefined>) => (
    <div className={cn("flex flex-col overflow-hidden rounded-2xl border border-separator", className)}>
        <Skeleton className="aspect-video w-full rounded-none" />
        <div className="flex flex-col gap-2 p-3">
            <Skeleton className="h-3 w-16 rounded-large" />
            <Skeleton className="h-4 w-full rounded-large" />
            <Skeleton className="h-3 w-24 rounded-large" />
            <Skeleton className="h-5 w-32 rounded-large" />
            <Skeleton className="h-5 w-24 rounded-large" />
        </div>
    </div>
)
