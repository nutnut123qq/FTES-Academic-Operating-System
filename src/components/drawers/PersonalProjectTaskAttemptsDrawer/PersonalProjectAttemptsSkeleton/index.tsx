"use client"

import React from "react"
import {
    ScrollShadow,
    Skeleton,
} from "@heroui/react"
import { SkeletonText } from "@/components/reuseable/SkeletonText"

/** Number of placeholder attempt cards shown while the list loads. */
const SKELETON_CARD_COUNT = 5

/**
 * Loading placeholder for {@link PersonalProjectTaskAttemptsDrawer}. Mirrors the
 * real {@link PersonalProjectAttemptCard}: an uppercase attempt label, a sparkle
 * + score-chip row, a short feedback line, and a processed-time line.
 */
export const PersonalProjectAttemptsSkeleton = () => {
    return (
        <ScrollShadow
            className="min-h-0 flex-1 overflow-x-hidden p-3"
            hideScrollBar
        >
            <div className="flex flex-col gap-3">
                {Array.from({ length: SKELETON_CARD_COUNT }).map((_unused, index) => (
                    <article
                        key={index}
                        className="rounded-3xl border border-divider/70 bg-content1 p-4 shadow-sm"
                    >
                        {/* attempt number label */}
                        <SkeletonText size="xs" width="w-24" />
                        {/* sparkle icon + score chip */}
                        <div className="mt-2 flex items-center gap-1.5">
                            <Skeleton className="size-5 rounded-full" />
                            <Skeleton className="h-6 w-16 rounded-full" />
                        </div>
                        {/* short feedback line */}
                        <div className="mt-2">
                            <SkeletonText size="sm" width="w-5/6" />
                        </div>
                        {/* processed-time line */}
                        <div className="mt-2">
                            <SkeletonText size="xs" width="w-1/3" />
                        </div>
                    </article>
                ))}
            </div>
        </ScrollShadow>
    )
}
