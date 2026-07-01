"use client"

import React from "react"
import { Skeleton, cn } from "@heroui/react"
import { WithClassNames } from "@/modules/types/base/class-name"

export type LessonCardSkeletonProps = WithClassNames<undefined>

/**
 * Render loading placeholders for lesson cards.
 * @param {LessonCardSkeletonProps} props Skeleton props (unused).
 */
export const LessonCardSkeleton = ({ className }: LessonCardSkeletonProps) => {
    return (
        <div className={cn("space-y-2", className)}>
            <Skeleton className="h-14 w-full rounded-2xl" />
            <Skeleton className="h-14 w-full rounded-2xl" />
        </div>
    )
}
