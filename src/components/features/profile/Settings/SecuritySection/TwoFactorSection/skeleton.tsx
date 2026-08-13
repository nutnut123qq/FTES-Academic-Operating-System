import React from "react"
import { Skeleton } from "@/components/blocks/skeleton/Skeleton"

/**
 * Loading state of the two-factor controls: the same icon + title/description column +
 * status chip + action button row the real method rows render, so the card keeps its
 * height while the MFA status request is in flight.
 *
 * TWO rows are drawn on purpose — the second method (email) may turn out not to be
 * offered at all, and a skeleton that under-draws jumps less than one that over-draws
 * would in the opposite direction.
 */
export const TwoFactorSectionSkeleton = () => {
    return (
        <div className="flex flex-col gap-3">
            {[0, 1].map((row) => (
                <div key={row} className="flex items-center gap-3">
                    <Skeleton className="size-5 shrink-0 rounded-md" />
                    <div className="flex min-w-0 flex-1 flex-col gap-0">
                        <Skeleton.Typography type="body-sm" className="w-40" />
                        <Skeleton.Typography type="body-xs" className="w-56" />
                    </div>
                    <Skeleton.Chip />
                    <Skeleton.Button width="w-20" />
                </div>
            ))}
        </div>
    )
}
