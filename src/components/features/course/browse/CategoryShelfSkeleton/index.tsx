import React from "react"
import { cn } from "@heroui/react"
import { Skeleton } from "@/components/blocks/skeleton/Skeleton"
import type { WithClassNames } from "@/modules/types/base/class-name"
import { CatalogCourseCardSkeleton } from "../CatalogCourseCardSkeleton"

/**
 * Loading placeholder for one {@link CategoryShelf} — mirrors the real shelf
 * (icon tile + title header bar, then a clipped row of card skeletons).
 */
export const CategoryShelfSkeleton = ({ className }: WithClassNames<undefined>) => (
    <div className={cn("flex flex-col gap-3", className)}>
        <div className="flex items-center gap-3">
            <Skeleton className="size-5 rounded-large" />
            <Skeleton className="h-5 w-32 rounded-large" />
            <Skeleton className="ml-auto h-4 w-20 rounded-large" />
        </div>
        <div className="flex gap-3 overflow-hidden">
            {[0, 1, 2, 3].map((card) => (
                <CatalogCourseCardSkeleton key={card} className="w-60 shrink-0 sm:w-64" />
            ))}
        </div>
    </div>
)
