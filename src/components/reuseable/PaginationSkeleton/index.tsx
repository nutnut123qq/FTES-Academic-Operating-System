"use client"

import React, { useMemo } from "react"
import { Skeleton, cn } from "@heroui/react"
import type { WithClassNames } from "@/modules/types/base/class-name"

/** Props for {@link PaginationSkeleton}. */
export interface PaginationSkeletonProps extends WithClassNames<undefined> {
    /** Extra classes on the outer wrapper (e.g. `mt-6`). */
    className?: string
    /** Number of page-number pill placeholders between prev/next. */
    pageCount?: number
}

/**
 * Loading placeholder for a centered HeroUI {@link Pagination} row.
 *
 * Mirrors the `sm` pagination layout: previous control, page links, next control.
 *
 * @param props.className - Optional wrapper classes.
 * @param props.pageCount - Page pill count (defaults to 3).
 */
export const PaginationSkeleton = ({
    className,
    pageCount = 3,
}: PaginationSkeletonProps) => {
    const pageIndexes = useMemo(
        () => Array.from({ length: pageCount }, (_, index) => index),
        [pageCount],
    )

    return (
        <div className={cn("flex justify-center", className)}>
            <div className="flex flex-wrap items-center justify-center gap-1">
                <Skeleton className="size-8 rounded-lg" />
                {pageIndexes.map((index) => (
                    <Skeleton key={index} className="size-8 rounded-lg" />
                ))}
                <Skeleton className="size-8 rounded-lg" />
            </div>
        </div>
    )
}
