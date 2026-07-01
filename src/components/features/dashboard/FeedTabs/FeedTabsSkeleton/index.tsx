"use client"

import React from "react"
import type {
    WithClassNames,
} from "@/modules/types/base/class-name"
import { Skeleton } from "@/components/blocks/skeleton/Skeleton"

/** Date-grouped activity rows shown while the feed loads. */
const SKELETON_GROUP_COUNT = 2

/** Placeholder activity rows per date group. */
const SKELETON_ROW_COUNT = 3

/** Props for {@link FeedTabsSkeleton}. */
export type FeedTabsSkeletonProps = WithClassNames<undefined>

/**
 * Loading placeholder for the explore activity feed inside {@link import("../").FeedTabs}:
 * mirrors the real {@link import("@/components/blocks").ActivityFeed} — date-grouped rows of
 * [avatar · two text lines] — so the feed card does not collapse / jump on resolve.
 *
 * @param props - {@link FeedTabsSkeletonProps}
 */
export const FeedTabsSkeleton = ({ className }: FeedTabsSkeletonProps) => {
    return (
        <div className={className}>
            <div className="flex flex-col gap-6">
                {Array.from({ length: SKELETON_GROUP_COUNT }).map((_group, groupIndex) => (
                    <div key={groupIndex} className="flex flex-col gap-3">
                        {/* date header */}
                        <Skeleton.Typography type="body-xs" width="1/4" />
                        {Array.from({ length: SKELETON_ROW_COUNT }).map((_row, rowIndex) => (
                            <div key={rowIndex} className="flex items-start gap-2">
                                <Skeleton className="size-9 shrink-0 rounded-full" />
                                <div className="flex flex-1 flex-col gap-0">
                                    <Skeleton.Typography type="body-sm" width="3/4" />
                                    <Skeleton.Typography type="body-xs" width="1/4" />
                                </div>
                            </div>
                        ))}
                    </div>
                ))}
            </div>
        </div>
    )
}
