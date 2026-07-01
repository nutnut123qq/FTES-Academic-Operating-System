"use client"

import { cn } from "@heroui/react"
import React from "react"
import { Skeleton } from "@/components/blocks/skeleton/Skeleton"
import type { WithClassNames } from "@/modules/types/base/class-name"

/** Props for {@link FoundationCardSkeleton}. */
export interface FoundationCardSkeletonProps extends WithClassNames<undefined> {
    /** Render a bottom divider — set on every row except the last in the list. */
    divider?: boolean
}

/**
 * Loading placeholder for one foundation resource row: mirrors the
 * {@link import("@/components/blocks").ListRow} layout (small thumbnail + title +
 * one-line description + trailing meta/caret) used by the real
 * {@link import("../FoundationCard").FoundationCard}.
 * @param props.divider - Bottom border for all but the last row in the joined list.
 * @param props.className - Optional root class names.
 */
export const FoundationCardSkeleton = ({
    divider = false,
    className,
}: FoundationCardSkeletonProps) => {
    return (
        <Skeleton.ListRow
            withTrailing
            className={cn("px-3", divider && "border-b border-separator", className)}
        />
    )
}
