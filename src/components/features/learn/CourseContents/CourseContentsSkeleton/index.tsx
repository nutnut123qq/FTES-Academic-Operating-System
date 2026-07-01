"use client"

import React from "react"
import type {
    WithClassNames,
} from "@/modules/types/base/class-name"
import { Skeleton } from "@/components/blocks/skeleton/Skeleton"

/** Number of placeholder lesson rows shown in the keep-going path. */
const SKELETON_LESSON_COUNT = 4

/** Props for {@link CourseContentsSkeleton}. */
export type CourseContentsSkeletonProps = WithClassNames<undefined>

/**
 * Loading placeholder for {@link import("../").CourseContents}: mirrors the real
 * dashboard — header (title + description + catalog meta), the flat continue +
 * progress block, then the current-module "keep going" path — so the page does not
 * jump when data arrives. The full tree lives in the rail, so the skeleton has no
 * search / accordion.
 *
 * @param props - {@link CourseContentsSkeletonProps}
 */
export const CourseContentsSkeleton = ({ className }: CourseContentsSkeletonProps) => {
    return (
        <div className={className}>
            {/* mirror loaded: PageHeader (header) → content cluster, gap-10 between; cluster gap-6 */}
            <div className="flex flex-col gap-10">
                {/* header tier — title + description + catalog meta (PageHeader mirror) */}
                <div className="flex flex-col gap-3">
                    <div className="flex flex-col gap-2">
                        <Skeleton.Typography type="h3" width="1/2" />
                        <Skeleton.Typography type="body-sm" width="2/3" />
                    </div>
                    <Skeleton.Typography type="body-xs" width="1/3" />
                </div>

                {/* content cluster — flat continue/progress + keep-going path (gap-6) */}
                <div className="flex flex-col gap-6">
                    <Skeleton className="h-20 w-full rounded-3xl" />
                    <div className="flex flex-col gap-3">
                        <Skeleton.Typography type="body-sm" width="1/3" />
                        <div className="flex flex-col gap-2">
                            {Array.from({ length: SKELETON_LESSON_COUNT }).map((_lesson, lessonIndex) => (
                                <Skeleton.ListRow key={lessonIndex} withTrailing />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
