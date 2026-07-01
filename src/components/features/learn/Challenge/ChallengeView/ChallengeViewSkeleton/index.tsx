"use client"

import React from "react"
import { cn } from "@heroui/react"
import type { WithClassNames } from "@/modules/types/base/class-name"
import { Skeleton } from "@/components/blocks/skeleton/Skeleton"

/** Number of placeholder brief sections shown while the challenge loads. */
const SKELETON_SECTION_COUNT = 3

/** Props for {@link ChallengeViewSkeleton}. */
export type ChallengeViewSkeletonProps = WithClassNames<undefined>

/**
 * Loading placeholder for {@link import("../").ChallengeView}: mirrors the split workspace
 * (centered brief column + the sticky submit/result aside) so the page does not flash an empty
 * shell while the challenge entity hydrates into redux.
 *
 * @param props - {@link ChallengeViewSkeletonProps}
 */
export const ChallengeViewSkeleton = ({ className }: ChallengeViewSkeletonProps) => {
    return (
        <div className={cn("flex flex-col gap-6 xl:flex-row xl:items-start xl:gap-8", className)}>
            {/* center — brief column */}
            <div className="min-w-0 flex-1">
                <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
                    <Skeleton.Typography type="body-sm" width="1/4" />
                    <div className="flex flex-col gap-3">
                        <Skeleton.Typography type="h4" width="3/4" />
                        <Skeleton className="h-6 w-40 rounded-full" />
                    </div>
                    <div className="flex flex-col gap-6">
                        {Array.from({ length: SKELETON_SECTION_COUNT }).map((_section, index) => (
                            <div key={index} className="flex flex-col gap-3">
                                <Skeleton.Typography type="body-sm" width="1/3" />
                                <Skeleton className="h-16 w-full rounded-2xl" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            {/* aside — submit + result cards */}
            <aside className="w-full shrink-0 xl:w-[360px]">
                <div className="flex flex-col gap-6">
                    <Skeleton className="h-52 w-full rounded-3xl" />
                    <Skeleton className="h-28 w-full rounded-3xl" />
                </div>
            </aside>
        </div>
    )
}
