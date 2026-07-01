"use client"

import React from "react"
import { Skeleton, cn } from "@heroui/react"
import type { WithClassNames } from "@/modules/types/base/class-name"
import { SkeletonText } from "@/components/reuseable/SkeletonText"

/** Number of placeholder task rows shown in the keep-going path. */
const SKELETON_TASK_COUNT = 4

/** Props for {@link PersonalProjectDashboardSkeleton}. */
export type PersonalProjectDashboardSkeletonProps = WithClassNames<undefined>

/**
 * Loading placeholder for {@link import("../").PersonalProjectDashboard}. Mirrors
 * the real flat layout: the continue + progress block over the current-milestone
 * "keep going" path, so nothing jumps when the milestones + progress land.
 * @param props - optional className for the root element
 */
export const PersonalProjectDashboardSkeleton = ({
    className,
}: PersonalProjectDashboardSkeletonProps = {}) => {
    return (
        <div className={cn("flex flex-col gap-6", className)}>
            {/* flat continue + progress block */}
            <div className="flex flex-col gap-3">
                <div className="flex items-start justify-between gap-3">
                    <div className="flex flex-col gap-1">
                        <SkeletonText size="sm" width="w-16" />
                        <SkeletonText size="sm" width="w-48" />
                    </div>
                    <Skeleton className="h-8 w-24 rounded-2xl" />
                </div>
                <Skeleton className="h-2 w-full rounded-full" />
                <SkeletonText size="sm" width="w-56" />
            </div>
            {/* keep-going path: section label + task rows */}
            <div className="flex flex-col gap-3">
                <SkeletonText size="sm" width="w-40" />
                <div className="flex flex-col gap-1">
                    {Array.from({ length: SKELETON_TASK_COUNT }, (_, index) => (
                        <Skeleton key={`pp-dash-task-${index}`} className="h-10 w-full rounded-2xl" />
                    ))}
                </div>
            </div>
        </div>
    )
}
