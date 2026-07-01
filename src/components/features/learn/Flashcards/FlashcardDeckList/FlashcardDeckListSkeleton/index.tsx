import React from "react"
import { Skeleton } from "@/components/blocks/skeleton/Skeleton"
import type { WithClassNames } from "@/modules/types/base/class-name"

/** Props for {@link FlashcardDeckListSkeleton}. */
export interface FlashcardDeckListSkeletonProps extends WithClassNames<undefined> {
    /** Number of placeholder deck cards to render. Defaults to `3`. */
    count?: number
}

/**
 * Loading placeholder for {@link FlashcardDeckList}. Mirrors the real deck cards:
 * a title row with a difficulty chip, a short description preview, and a footer
 * row with the card count and the study button.
 * @param props - {@link FlashcardDeckListSkeletonProps}
 */
export const FlashcardDeckListSkeleton = ({
    count = 3,
    className,
}: FlashcardDeckListSkeletonProps) => {
    return (
        <div className={className}>
            <div className="flex flex-col gap-3">
                {Array.from({ length: Math.max(count, 1) }).map((_unused, index) => (
                    <div key={index} className="rounded-3xl border border-default bg-surface p-4">
                        <div className="flex flex-col gap-2">
                            {/* title + difficulty chip */}
                            <div className="flex items-center justify-between gap-3">
                                <Skeleton.Typography type="body" width="1/2" />
                                <Skeleton.Chip />
                            </div>
                            {/* description preview */}
                            <Skeleton.Typography type="body-sm" width="3/4" />
                            {/* card count + study button */}
                            <div className="flex items-center justify-between gap-3">
                                <Skeleton.Typography type="body-xs" width="1/4" />
                                <Skeleton.Button />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
