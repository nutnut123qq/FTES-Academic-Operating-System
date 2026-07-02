import React from "react"
import { cn } from "@heroui/react"
import type { WithClassNames } from "@/modules/types/base/class-name"
import { CatalogCourseCardSkeleton } from "../CatalogCourseCardSkeleton"

/**
 * Loading placeholder for the category landing grid — mirrors the eventual
 * responsive card grid (1 / 2 / 3 columns) with card-shaped skeletons.
 */
export const CategoryGridSkeleton = ({ className }: WithClassNames<undefined>) => (
    <div className={cn("grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3", className)}>
        {[0, 1, 2, 3, 4, 5].map((card) => (
            <CatalogCourseCardSkeleton key={card} />
        ))}
    </div>
)
