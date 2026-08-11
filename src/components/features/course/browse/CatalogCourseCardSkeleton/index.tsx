import React from "react"
import { cn } from "@heroui/react"
import { Skeleton } from "@/components/blocks/skeleton/Skeleton"
import type { WithClassNames } from "@/modules/types/base/class-name"

/**
 * Loading placeholder for one {@link CatalogCourseCard} — mirrors the real box
 * per the house skeleton rule: inset 16:9 cover, the fixed two-line title row
 * (`min-h-14`) with the save toggle beside it, one meta row, a 2-line
 * description, then the bottom-pinned mentor + CTA group.
 *
 * It deliberately has NO course-code line: the real card stopped rendering the
 * BE `courseCode`, and the leftover skeleton row made the placeholder one row
 * taller than the card that replaced it — the grid visibly jumped on load.
 */
export const CatalogCourseCardSkeleton = ({ className }: WithClassNames<undefined>) => (
    <div className={cn("flex h-full flex-col rounded-lg border border-separator p-3", className)}>
        <Skeleton className="aspect-video w-full rounded-md" />
        <div className="flex flex-1 flex-col gap-1.5 pt-3">
            {/* title (2 reserved lines) + the save toggle, same row as the card */}
            <div className="flex min-h-14 items-start justify-between gap-2">
                <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                    <Skeleton className="h-5 w-full rounded-large" />
                    <Skeleton className="h-5 w-3/5 rounded-large" />
                </div>
                <Skeleton className="size-9 shrink-0 rounded-large" />
            </div>
            {/* meta row: level chip · lessons · rating · learners */}
            <Skeleton className="h-5 w-44 rounded-large" />
            {/* description (2 lines) */}
            <Skeleton className="h-4 w-full rounded-large" />
            <Skeleton className="h-4 w-4/5 rounded-large" />
            {/* mentor + CTA footer — one bottom-pinned group, like the card */}
            <div className="mt-auto flex flex-col gap-1.5">
                <Skeleton className="h-5 w-28 rounded-large" />
                <div className="flex justify-end border-t border-separator pt-2">
                    <Skeleton className="h-6 w-24 rounded-large" />
                </div>
            </div>
        </div>
    </div>
)
