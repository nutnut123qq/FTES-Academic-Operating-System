"use client"

import { cn } from "@heroui/react"
import React from "react"
import type { WithClassNames } from "@/modules/types/base/class-name"
import { Skeleton } from "@/components/blocks/skeleton/Skeleton"

/** Props for {@link FoundationCategoryCardSkeleton}. */
export interface FoundationCategoryCardSkeletonProps extends WithClassNames<undefined> {
    /** Render a bottom divider — set on every row except the last in the list. */
    divider?: boolean
}

/**
 * Loading placeholder for one foundation category row: mirrors the
 * {@link import("@/components/blocks").ListRow} layout (small thumbnail + title +
 * one-line description + trailing caret) used by the real
 * {@link import("../").FoundationCategoryCard}.
 * @param props.divider - Bottom border for all but the last row in the joined list.
 * @param props.className - Optional root class names.
 */
export const FoundationCategoryCardSkeleton = ({
    divider = false,
    className,
}: FoundationCategoryCardSkeletonProps) => {
    return (
        <Skeleton.ListRow
            withTrailing
            className={cn("px-3", divider && "border-b border-separator", className)}
        />
    )
}
