import React from "react"
import { Skeleton } from "@/components/blocks/skeleton/Skeleton"
import type { WithClassNames } from "@/modules/types/base/class-name"

/**
 * Loading placeholder for the flashcard reviewer. Mirrors the real layout: a
 * progress bar, one fixed-height flashcard, and the prev/flip/next controls.
 */
export const FlashcardReviewerSkeleton = ({ className }: WithClassNames<undefined> = {}) => {
    return (
        <div className={className}>
            <div className="flex flex-col gap-6">
                {/* progress bar */}
                <Skeleton className="h-1.5 w-full rounded-full" />
                {/* the flashcard — fixed-height bordered surface (mirrors FlipCard) */}
                <div className="flex h-80 flex-col gap-3 rounded-2xl border border-default bg-surface p-6 sm:h-[22rem]">
                    <Skeleton.Typography type="body" width="3/4" />
                    <Skeleton.Typography type="body" width="2/3" />
                    <Skeleton.Typography type="body" width="1/2" />
                </div>
                {/* prev / flip / next */}
                <div className="flex items-center justify-between gap-3">
                    <Skeleton.Button />
                    <Skeleton.Button />
                    <Skeleton.Button />
                </div>
            </div>
        </div>
    )
}
