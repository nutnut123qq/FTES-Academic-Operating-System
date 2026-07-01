"use client"

import React from "react"
import type {
    WithClassNames,
} from "@/modules/types/base/class-name"
import { Skeleton } from "@/components/blocks/skeleton/Skeleton"

/** Number of placeholder modules shown while the content-map loads. */
const SKELETON_MODULE_COUNT = 3

/** Number of placeholder lesson rows shown per skeleton module. */
const SKELETON_LESSON_COUNT = 4

/** Props for {@link ContentMapSkeleton}. */
export type ContentMapSkeletonProps = WithClassNames<undefined>

/**
 * Loading placeholder for {@link import("../").ContentMap}: mirrors the module
 * header (title bar + progress bar) and a few compact lesson rows so the rail does
 * not jump when the outline arrives.
 *
 * @param props - {@link ContentMapSkeletonProps}
 */
export const ContentMapSkeleton = ({ className }: ContentMapSkeletonProps) => {
    return (
        <div className={className}>
            <div className="flex flex-col gap-6">
                {Array.from({ length: SKELETON_MODULE_COUNT }).map((_module, moduleIndex) => (
                    <div key={moduleIndex} className="flex flex-col gap-3">
                        <Skeleton.Typography type="body-sm" width="2/3" />
                        <Skeleton.ProgressBar />
                        <div className="flex flex-col gap-2">
                            {Array.from({ length: SKELETON_LESSON_COUNT }).map((_lesson, lessonIndex) => (
                                <Skeleton.ListRow key={lessonIndex} withTrailing />
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
